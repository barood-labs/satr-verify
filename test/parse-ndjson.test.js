import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyProcessExit, evidencePathFromStderr, parseKaneNdjson } from "../src/parse-ndjson.js";

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

test("parses the captured kane-cli 0.10.4 passing run", () => {
  const raw = fs.readFileSync(path.join(fixtures, "warmup.ndjson"), "utf8");
  const parsed = parseKaneNdjson(`noise before json\n${raw}\n`);
  assert.equal(parsed.ignored_lines, 1);
  assert.equal(parsed.cli_version, "0.10.4");
  assert.equal(parsed.surface, "run");
  assert.equal(parsed.completion_type, "run_end");
  assert.equal(parsed.status, "passed");
  assert.equal(parsed.verdict, "passed");
  assert.equal(parsed.exit_code, 0);
  assert.equal(parsed.result_code, 100);
  assert.equal(parsed.reason_code, "success.complete");
  assert.equal(parsed.one_liner, "verified the page heading on example.com");
  assert.equal(parsed.duration_s, 11.7);
  assert.ok(Math.abs(parsed.credits_consumed - 11.369674999999999) < 1e-9);
  assert.equal(parsed.final_state.page_heading, "Example Domain");
  assert.equal(parsed.final_state.url, "https://example.com/");
  assert.equal(parsed.run_id, "run-0");
  assert.equal(
    parsed.test_url,
    "https://test-manager.lambdatest.com/projects/01M7DEFKES5QP35A9974V05XNA/test-cases/01M7DEG9Y8B4JXS8PK26GC30JR/dashboard/share/US_0HLCG848J1B0WWMGHAWALTJ7PL596IN0Y6SZ4JYCDXC5G6GFMAJCQ82RPAVG77AI?type=summary&agentView=true&fqdn=summary-page",
  );
  assert.equal(parsed.video_trace, parsed.test_url);
  assert.equal(
    parsed.evidence_pack,
    "/home/box/.testmuai/kaneai/sessions/e9c8cae1-948e-45e1-a499-7acd1f05d82d/evidence/68a4afa5-4e82-4701-829d-9a0e73439646.evidence",
  );
  assert.equal(parsed.session_dir, "/home/box/.testmuai/kaneai/sessions/e9c8cae1-948e-45e1-a499-7acd1f05d82d");
  assert.equal(parsed.run_dir, "/home/box/.testmuai/kaneai/sessions/e9c8cae1-948e-45e1-a499-7acd1f05d82d/runs/0");
  assert.equal(parsed.recording.enabled, true);
  assert.equal(parsed.recording.session_id, "e9c8cae1-948e-45e1-a499-7acd1f05d82d");
  assert.equal(parsed.failed_step, null);
  assert.equal(parsed.checks.length, 1);
  assert.equal(parsed.checks[0].name, "page_heading_check");
  assert.equal(parsed.checks[0].expected, "Example Domain");
  assert.equal(parsed.checks[0].actual, "Example Domain");
  assert.equal(parsed.checks[0].operator, "equals");
  assert.equal(parsed.checks[0].passed, true);
  assert.equal(parsed.per_flow_metadata[0].result_code, "100");
  assert.equal(parsed.steps.filter((step) => step.status === "done").length, 3);
  assert.equal(parsed.skill_update.latest, "0.1.4");
});

test("designs a failure on the same run_end fields", () => {
  const raw = fs.readFileSync(path.join(fixtures, "arabic-heading-mismatch.ndjson"), "utf8");
  const parsed = parseKaneNdjson(raw);
  assert.equal(parsed.verdict, "failed");
  assert.equal(parsed.exit_code, 1);
  assert.equal(parsed.result_code, 710);
  assert.equal(parsed.reason_code, "assertion_error.final_verification");
  assert.equal(parsed.failed_step.step, 4);
  assert.match(parsed.failed_step.remark, /Get a state ID/);
  assert.equal(parsed.expected, "استخراج بطاقة هوية الولاية");
  assert.equal(parsed.actual, "Get a state ID");
  assert.equal(parsed.failed_check.passed, false);
  assert.equal(parsed.failed_check.operator, "equals");
  assert.match(parsed.per_flow_metadata[0].error_message, /Get a state ID/);
  assert.match(parsed.video_trace, /^https:\/\/test-manager\.lambdatest\.com\//);
  assert.match(parsed.evidence_pack, /\.evidence$/);
  assert.equal(parsed.credits_consumed, 14.25);
});

test("a run that never reaches run_end did not start", () => {
  const raw = fs.readFileSync(path.join(fixtures, "did-not-start.ndjson"), "utf8");
  const parsed = parseKaneNdjson(raw);
  assert.equal(parsed.completed, false);
  assert.equal(parsed.verdict, "did_not_start");
  assert.equal(parsed.exit_code, 2);
  assert.match(parsed.errors[0].message, /kane-cli login/);
});

test("testmd overall_status wins over an earlier passing run_end", () => {
  const raw = fs.readFileSync(path.join(fixtures, "testmd-step-failed.ndjson"), "utf8");
  const parsed = parseKaneNdjson(raw);
  assert.equal(parsed.surface, "testmd");
  assert.equal(parsed.completion_type, "test_md_done");
  assert.equal(parsed.verdict, "failed");
  assert.equal(parsed.exit_code, 1);
  assert.equal(parsed.duration_s, 12.4);
  assert.equal(parsed.failed_step.step, 2);
  assert.equal(parsed.expected, "الاتجاه: من اليمين إلى اليسار");
  assert.equal(parsed.actual, "Direction: left to right");
  assert.equal(parsed.result_code, 720);
  assert.equal(parsed.reason_code, "assertion_error.checkpoint_failed");
  assert.equal(parsed.video_trace, "https://test-manager.lambdatest.com/share/TESTMD_FIXTURE_DIRECTION");
  assert.equal(parsed.test_url, parsed.video_trace);
  assert.equal(parsed.run_dir, null);
  assert.equal(parsed.checks.length, 1);
});

test("real testmd captures sum step credits and use the share URL", () => {
  const cases = [
    ["real-arabic-toggle.ndjson", 13.839324999999999 + 17.861935],
    ["real-check-document.ndjson", 16.6019625 + 16.0869625],
    ["real-open-checklist.ndjson", 10.37407 + 16.970405],
  ];
  for (const [name, credits] of cases) {
    const parsed = parseKaneNdjson(fs.readFileSync(path.join(fixtures, name), "utf8"));
    assert.equal(parsed.surface, "testmd", name);
    assert.equal(parsed.verdict, "passed", name);
    assert.equal(parsed.cli_version, "0.10.4", name);
    assert.ok(Math.abs(parsed.credits_consumed - credits) < 1e-9, `${name} credits ${parsed.credits_consumed}`);
    assert.ok(parsed.share_url.startsWith("https://test-manager.lambdatest.com/"), name);
    assert.equal(parsed.test_url, parsed.share_url, name);
    assert.equal(parsed.video_trace, parsed.share_url, name);
    assert.equal(parsed.run_dir, null, name);
    assert.match(parsed.evidence_pack, /\.evidence$/, name);
    assert.match(parsed.session_dir, /\/sessions\/[0-9a-f-]+$/, name);
    assert.ok(parsed.checks.length >= 2, name);
  }
});

test("process exit code wins when it disagrees with the stream", () => {
  const parsed = parseKaneNdjson(fs.readFileSync(path.join(fixtures, "warmup.ndjson"), "utf8"));
  const adjusted = applyProcessExit(parsed, 1);
  assert.equal(adjusted.verdict, "failed");
  assert.equal(adjusted.exit_code, 1);
  assert.equal(adjusted.exit_disagrees, true);
  assert.equal(adjusted.result_code, 100);
});

test("stderr evidence hint is the trace when the stream has no pack", () => {
  const stderr = "evidence: view locally with `kane-cli evidence serve /tmp/packs/run.evidence`\n";
  assert.equal(evidencePathFromStderr(stderr), "/tmp/packs/run.evidence");
  const parsed = parseKaneNdjson('{"type":"run_end","status":"passed","result_code":100,"reason_code":"success.complete"}\n', {
    stderr,
  });
  assert.equal(parsed.evidence_pack, "/tmp/packs/run.evidence");
  assert.equal(parsed.video_trace, "/tmp/packs/run.evidence");
});
