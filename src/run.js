import fs from "node:fs";
import path from "node:path";
import { discoverFlows } from "./flows.js";
import { buildKaneInvocation, kaneAuthFromEnv, runKane, writeVariablesFile } from "./kane.js";
import { applyProcessExit, parseKaneNdjson } from "./parse-ndjson.js";
import { agentNext, writeReport } from "./report.js";

export const PAGES_URL = "https://barood-labs.github.io/satr-verify/";

export async function executeRun(options) {
  const root = options.root ?? process.cwd();
  const url = options.url ?? process.env.SATR_URL ?? `http://127.0.0.1:${options.port ?? 4173}`;
  const outDir = options.outDir ?? path.join(root, ".satr");
  const flows = options.flows ?? discoverFlows(root, { flow: options.flow });
  if (!flows.length) {
    const report = baseReport({
      mode: options.mode ?? "kane",
      url,
      verdict: "did_not_start",
      exit_code: 2,
      flows: [],
    });
    report.agent_next = `No flows matched ${options.flow || "flows/"}. Add a *_test.md or *.flow.md file.`;
    const paths = writeReport(outDir, report);
    return { report, ...paths, exitCode: 2 };
  }

  if (options.dryRun) {
    const auth = kaneAuthFromEnv(options.env ?? process.env, {
      username: options.username,
      accessKey: options.accessKey,
    });
    const planned = flows.map((flow) => {
      const invocation = buildKaneInvocation({
        bin: options.kaneBin ?? process.env.KANE_CLI_BIN ?? "kane-cli",
        flow,
        url,
        auth: auth.username ? auth : null,
        headless: options.headless !== false,
        timeout: options.timeout ?? 150,
        variablesFile: "<temp variables file>",
      });
      return {
        file: flow.file,
        kind: flow.kind,
        verdict: "dry_run",
        command: invocation.display,
        spec_steps: flow.spec_steps,
      };
    });
    const report = baseReport({ mode: "dry-run", url, verdict: "dry_run", exit_code: 0, flows: planned });
    report.agent_next = agentNext(report);
    if (auth.error) report.auth_error = auth.error;
    const paths = writeReport(outDir, report);
    return { report, ...paths, exitCode: 0 };
  }

  if (options.fixture) {
    const stdout = fs.readFileSync(options.fixture, "utf8");
    const stderr = options.stderrFixture ? fs.readFileSync(options.stderrFixture, "utf8") : options.stderr ?? "";
    const parsed = applyProcessExit(parseKaneNdjson(stdout, { stderr }), options.exitCode ?? null);
    const flow = flows.length === 1 ? flows[0] : { file: path.basename(options.fixture), kind: "fixture", spec_steps: [] };
    const entry = flowEntry(flow, parsed, { command: `fixture ${options.fixture}`, url });
    const report = baseReport({
      mode: "fixture",
      url,
      verdict: entry.verdict,
      exit_code: entry.exit_code,
      flows: [entry],
    });
    report.agent_next = agentNext(report);
    const paths = writeReport(outDir, report);
    return { report, ...paths, exitCode: report.exit_code };
  }

  const auth = kaneAuthFromEnv(options.env ?? process.env, {
    username: options.username,
    accessKey: options.accessKey,
  });
  if (auth.error) {
    const report = baseReport({
      mode: "kane",
      url,
      verdict: "did_not_start",
      exit_code: 2,
      flows: flows.map((flow) => ({ file: flow.file, kind: flow.kind, verdict: "did_not_start", errors: [{ message: auth.error }] })),
    });
    report.agent_next = auth.error;
    const paths = writeReport(outDir, report);
    return { report, ...paths, exitCode: 2 };
  }

  const entries = [];
  for (const flow of flows) {
    const variablesFile = flow.kind === "testmd" ? writeVariablesFile(url) : null;
    const invocation = buildKaneInvocation({
      bin: options.kaneBin ?? process.env.KANE_CLI_BIN ?? "kane-cli",
      flow,
      url,
      auth,
      headless: options.headless !== false,
      timeout: options.timeout ?? 150,
      variablesFile,
    });
    process.stderr.write(`\nsatr-verify: ${invocation.display}\n`);
    let result;
    try {
      result = await runKane(invocation, {
        spawnImpl: options.spawnImpl,
        env: options.env ?? process.env,
        mirrorStderr: options.mirrorStderr !== false,
      });
    } finally {
      if (variablesFile) fs.rmSync(variablesFile, { force: true });
    }
    if (options.saveRaw !== false) {
      const rawDir = path.join(outDir, "raw");
      fs.mkdirSync(rawDir, { recursive: true });
      const stem = flow.name?.replace(/\.md$/, "") ?? "flow";
      fs.writeFileSync(path.join(rawDir, `${stem}.ndjson`), result.stdout ?? "");
      fs.writeFileSync(path.join(rawDir, `${stem}.stderr.txt`), result.stderr ?? "");
    }
    let parsed = parseKaneNdjson(result.stdout ?? "", { stderr: result.stderr ?? "" });
    if (result.spawnError && !parsed.errors.length) {
      parsed = {
        ...parsed,
        errors: [{ message: result.spawnError, code: "spawn", remedy: null }],
        verdict: "did_not_start",
        exit_code: 2,
      };
    }
    parsed = applyProcessExit(parsed, result.exitCode);
    entries.push(flowEntry(flow, parsed, { command: invocation.display, url }));
    process.stderr.write(`satr-verify: ${flow.file} → ${parsed.verdict}\n`);
  }

  const exitCode = aggregateExit(entries);
  const verdict = verdictForExit(exitCode);
  const report = baseReport({ mode: "kane", url, verdict, exit_code: exitCode, flows: entries });
  report.agent_next = agentNext(report);
  const paths = writeReport(outDir, report);
  return { report, ...paths, exitCode };
}

function baseReport({ mode, url, verdict, exit_code, flows }) {
  return {
    tool: "satr-verify",
    version: "0.1.0",
    generated_at: new Date().toISOString(),
    mode,
    url,
    verdict,
    exit_code,
    flows,
    agent_next: "",
  };
}

function flowEntry(flow, parsed, { command }) {
  const failedCheck = parsed.failed_check ?? null;
  return {
    file: flow.file,
    kind: flow.kind,
    command,
    verdict: parsed.verdict,
    exit_code: parsed.exit_code,
    process_exit_code: parsed.process_exit_code ?? null,
    exit_disagrees: Boolean(parsed.exit_disagrees),
    cli_version: parsed.cli_version,
    surface: parsed.surface,
    result_code: parsed.result_code,
    reason_code: parsed.reason_code,
    reason: parsed.reason,
    summary: parsed.summary,
    one_liner: parsed.one_liner,
    duration_s: parsed.duration_s,
    credits_consumed: parsed.credits_consumed,
    failed_step: parsed.failed_step,
    check_name: failedCheck?.name ?? null,
    operator: failedCheck?.operator ?? null,
    expected: parsed.expected,
    actual: parsed.actual,
    reasoning: failedCheck?.reasoning ?? null,
    checks: parsed.checks,
    final_state: parsed.final_state,
    video_trace: parsed.video_trace,
    evidence_pack: parsed.evidence_pack,
    session_dir: parsed.session_dir,
    run_dir: parsed.run_dir,
    test_url: parsed.test_url,
    share_url: parsed.share_url,
    recording: parsed.recording,
    warnings: parsed.warnings,
    errors: parsed.errors,
    per_flow_metadata: parsed.per_flow_metadata,
    spec_steps: flow.spec_steps ?? [],
  };
}

export function aggregateExit(entries) {
  const codes = entries.map((entry) => entry.exit_code);
  if (codes.includes(1)) return 1;
  if (codes.includes(3)) return 3;
  if (codes.includes(2)) return 2;
  return 0;
}

function verdictForExit(exitCode) {
  if (exitCode === 0) return "passed";
  if (exitCode === 2) return "did_not_start";
  if (exitCode === 3) return "timeout";
  return "failed";
}
