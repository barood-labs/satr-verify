/**
 * Parse Kane CLI `--agent` NDJSON.
 *
 * The field set is taken from a real `kane-cli` 0.10.4 `run` capture
 * (test/fixtures/warmup.ndjson): stream_start, recording_state, bifurcation,
 * untyped step lines, coverage.pack, and run_end with result_code,
 * reason_code, per_flow_metadata, credits_consumed, run_dir, and test_url.
 *
 * `testmd run` is the same stream plus a file-level `test_md_done`. An
 * embedded `run_end` finishes one step. It does not finish the file.
 */

const TERMINALS = new Set(["run_end", "test_md_done", "testrun_done", "remote_done"]);

export function parseKaneNdjson(stdout, { stderr = "" } = {}) {
  const events = [];
  let ignored = 0;
  const text = String(stdout ?? "").replace(/^\uFEFF/, "");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!trimmed.startsWith("{")) {
      ignored += 1;
      continue;
    }
    try {
      events.push(JSON.parse(trimmed));
    } catch {
      ignored += 1;
    }
  }

  const streamStart = events.find((event) => event.type === "stream_start") ?? null;
  const surface = streamStart?.surface ?? inferSurface(events);
  const runEnds = events.filter((event) => event.type === "run_end");
  const testMdDone = lastOfType(events, "test_md_done");
  const testrunDone = lastOfType(events, "testrun_done");
  const completion = pickCompletion(surface, { runEnds, testMdDone, testrunDone });
  const primaryRunEnd = completion?.type === "run_end" ? completion : runEnds.at(-1) ?? null;

  const steps = events
    .filter((event) => event.step != null && event.type == null)
    .map((event) => ({
      step: event.step,
      status: event.status ?? null,
      remark: event.remark ?? "",
      ts: event.ts ?? null,
      child_id: event.child_id ?? null,
    }));
  const failedStep = [...steps].reverse().find((step) => step.status === "failed") ?? null;

  const checks = runEnds.flatMap((runEnd) => checksFromRunEnd(runEnd));
  const failedCheck = checks.find((check) => check.passed === false) ?? null;

  const coverageEvent = [...events].reverse().find((event) => event.type === "coverage" && event.pack);
  const evidenceFromStderr = evidencePathFromStderr(stderr);
  const evidencePack = coverageEvent?.pack ?? evidenceFromStderr ?? null;

  const recordingEvent = events.find((event) => event.type === "recording_state") ?? null;
  const warnings = events.filter((event) => event.type === "warning");
  const errors = events.filter((event) => event.type === "error");

  const status = completionStatus(completion);
  const resultCode = normalizeResultCode(
    primaryRunEnd?.result_code ?? primaryRunEnd?.per_flow_metadata?.[0]?.result_code,
  );
  const reasonCode = primaryRunEnd?.reason_code ?? primaryRunEnd?.per_flow_metadata?.[0]?.reason_code ?? null;
  const derived = deriveVerdict({ status, resultCode, reasonCode, completion, errors, events });

  const testUrl = primaryRunEnd?.test_url ?? null;
  const shareUrl = testMdDone?.share_url ?? testrunDone?.share_url ?? null;
  const videoTrace = firstTrace(testUrl, shareUrl, evidencePack, primaryRunEnd?.session_dir ?? null);

  return {
    events,
    ignored_lines: ignored,
    surface,
    cli_version: streamStart?.cli_version ?? null,
    started: events.length > 0,
    completed: completion != null,
    completion_type: completion?.type ?? null,
    status,
    verdict: derived.verdict,
    exit_code: derived.exit_code,
    result_code: resultCode,
    reason_code: reasonCode,
    reason: primaryRunEnd?.reason ?? null,
    summary: primaryRunEnd?.summary ?? null,
    one_liner: primaryRunEnd?.one_liner ?? null,
    duration_s: durationOf(completion, primaryRunEnd),
    credits_consumed: creditsOf(primaryRunEnd),
    final_state: primaryRunEnd?.final_state ?? {},
    session_dir: primaryRunEnd?.session_dir ?? null,
    run_dir: primaryRunEnd?.run_dir ?? null,
    run_id: primaryRunEnd?.run_id ?? null,
    test_url: testUrl,
    share_url: shareUrl,
    video_trace: videoTrace,
    evidence_pack: evidencePack,
    recording: recordingEvent
      ? {
          enabled: Boolean(recordingEvent.enabled),
          session_id: recordingEvent.session_id ?? null,
          persist: Boolean(recordingEvent.persist),
        }
      : null,
    steps,
    failed_step: failedStep
      ? { step: failedStep.step, remark: failedStep.remark, ts: failedStep.ts }
      : null,
    checks,
    failed_check: failedCheck,
    expected: failedCheck?.expected ?? null,
    actual: failedCheck?.actual ?? (failedStep ? failedStep.remark : null),
    warnings: warnings.map(compactWarning),
    errors: errors.map((event) => ({
      message: event.message ?? "",
      code: event.code ?? null,
      remedy: event.remedy ?? null,
    })),
    per_flow_metadata: primaryRunEnd?.per_flow_metadata ?? [],
    coverage: coverageEvent
      ? { status: coverageEvent.status ?? null, reason: coverageEvent.reason ?? null, pack: coverageEvent.pack ?? null }
      : primaryRunEnd?.coverage ?? testMdDone?.coverage ?? null,
    skill_update: events.find((event) => event.type === "skill_update_available") ?? null,
    bifurcations: events.filter((event) => event.type === "bifurcation").map((event) => event.flows ?? []),
  };
}

export function applyProcessExit(parsed, exitCode) {
  if (exitCode == null) return parsed;
  let verdict;
  if (exitCode === 0) verdict = "passed";
  else if (exitCode === 2) verdict = "did_not_start";
  else if (exitCode === 3) verdict = parsed.verdict === "cancelled" ? "cancelled" : "timeout";
  else verdict = "failed";
  return {
    ...parsed,
    process_exit_code: exitCode,
    exit_code: exitCode,
    verdict,
    exit_disagrees: parsed.exit_code !== exitCode,
  };
}

export function evidencePathFromStderr(stderr) {
  const match = /kane-cli evidence serve\s+([^`\s]+)/.exec(String(stderr ?? ""));
  return match ? match[1] : null;
}

function inferSurface(events) {
  if (events.some((event) => event.type === "test_md_done")) return "testmd";
  if (events.some((event) => event.type === "testrun_done")) return "testrun";
  if (events.some((event) => event.type === "run_end")) return "run";
  return null;
}

function pickCompletion(surface, { runEnds, testMdDone, testrunDone }) {
  if (surface === "testmd") return testMdDone;
  if (surface === "testrun") return testrunDone ?? testMdDone;
  if (surface === "run") return runEnds.at(-1) ?? null;
  return testMdDone ?? testrunDone ?? runEnds.at(-1) ?? null;
}

function completionStatus(completion) {
  if (!completion) return null;
  if (completion.type === "test_md_done") return completion.overall_status ?? null;
  if (completion.type === "testrun_done") return completion.status ?? null;
  return completion.status ?? null;
}

function durationOf(completion, runEnd) {
  if (completion?.type === "test_md_done" && completion.duration_s != null) return completion.duration_s;
  if (completion?.duration != null) return completion.duration;
  if (runEnd?.duration != null) return runEnd.duration;
  return null;
}

function creditsOf(runEnd) {
  if (!runEnd) return null;
  if (runEnd.credits_consumed != null) return runEnd.credits_consumed;
  if (runEnd.credits != null) return runEnd.credits;
  return null;
}

function normalizeResultCode(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function checksFromRunEnd(runEnd) {
  const memory = runEnd?.context?.memory;
  if (!memory || typeof memory !== "object") return [];
  const checks = [];
  for (const [name, entry] of Object.entries(memory)) {
    if (!entry || typeof entry !== "object") continue;
    if (entry.expected_value == null && entry.extracted_value == null && entry.condition == null) continue;
    checks.push({
      name,
      expected: entry.expected_value ?? null,
      actual: entry.extracted_value ?? null,
      operator: entry.operator ?? null,
      passed: checkPassed(entry),
      step: entry.step ?? null,
      reasoning: entry.reasoning ?? null,
      condition: entry.condition ?? null,
      query: entry.query ?? null,
      analyzer_type: entry.analyzer_type ?? null,
    });
  }
  return checks;
}

function checkPassed(entry) {
  const reasoning = String(entry.reasoning ?? "");
  if (/->\s*FAIL\b/.test(reasoning)) return false;
  if (/->\s*PASS\b/.test(reasoning)) return true;
  if (entry.operator === "equals" && entry.expected_value != null && entry.extracted_value != null) {
    return String(entry.expected_value) === String(entry.extracted_value);
  }
  return null;
}

function deriveVerdict({ status, resultCode, reasonCode, completion, errors, events }) {
  if (!completion) {
    return { verdict: "did_not_start", exit_code: 2 };
  }
  const reason = String(reasonCode ?? "");
  if (status === "passed" || (resultCode != null && resultCode >= 100 && resultCode < 200)) {
    return { verdict: "passed", exit_code: 0 };
  }
  if (reason.startsWith("cancelled") || (resultCode != null && resultCode >= 200 && resultCode < 300)) {
    return { verdict: "cancelled", exit_code: 3 };
  }
  if (reason.includes("timeout")) {
    return { verdict: "timeout", exit_code: 3 };
  }
  if (status === "failed" || status === "error" || status === "broken") {
    return { verdict: "failed", exit_code: 1 };
  }
  if (errors.length && events.filter((event) => TERMINALS.has(event.type)).length === 0) {
    return { verdict: "did_not_start", exit_code: 2 };
  }
  return { verdict: "failed", exit_code: 1 };
}

function firstTrace(...candidates) {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) return candidate;
  }
  return null;
}

function lastOfType(events, type) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (events[index].type === type) return events[index];
  }
  return null;
}

function compactWarning(event) {
  return {
    code: event.code ?? null,
    message: event.message ?? "",
    variables: event.variables ?? [],
    suggested_file: event.suggested_file ?? null,
  };
}
