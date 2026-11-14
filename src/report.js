import fs from "node:fs";
import path from "node:path";

export function writeReport(directory, report) {
  fs.mkdirSync(directory, { recursive: true });
  const jsonPath = path.join(directory, "last-run.json");
  const mdPath = path.join(directory, "last-run.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(mdPath, formatReport(report));
  return { jsonPath, mdPath };
}

export function formatReport(report) {
  const lines = [];
  lines.push("# Satr Verify");
  lines.push("");
  lines.push(`Verdict: **${report.verdict}**`);
  lines.push(`Exit code: ${report.exit_code}`);
  lines.push(`Mode: ${report.mode}`);
  if (report.url) lines.push(`URL: ${report.url}`);
  lines.push(`When: ${report.generated_at}`);
  lines.push("");
  lines.push(introFor(report));
  lines.push("");

  if (report.mode === "dry-run") {
    lines.push("## Flows that would run");
    lines.push("");
    for (const flow of report.flows) {
      lines.push(`- \`${flow.file}\` via \`${flow.kind}\``);
      lines.push("");
      lines.push("```");
      lines.push(flow.command);
      lines.push("```");
      lines.push("");
    }
    lines.push("Kane CLI was not started. Nothing was proved about the page.");
    lines.push("");
    return `${lines.join("\n")}\n`;
  }

  for (const flow of report.flows) {
    lines.push(`## ${flow.file}`);
    lines.push("");
    lines.push(`- Status: ${flow.verdict}`);
    if (flow.cli_version) lines.push(`- Kane CLI: ${flow.cli_version}`);
    if (flow.surface) lines.push(`- Surface: ${flow.surface}`);
    if (flow.result_code != null) lines.push(`- Result code: ${flow.result_code}`);
    if (flow.reason_code) lines.push(`- Reason code: ${flow.reason_code}`);
    if (flow.reason) lines.push(`- Reason: ${flow.reason}`);
    if (flow.one_liner) lines.push(`- One line: ${flow.one_liner}`);
    if (flow.duration_s != null) lines.push(`- Duration: ${flow.duration_s}s`);
    if (flow.credits_consumed != null) lines.push(`- Credits: ${roundCredits(flow.credits_consumed)}`);
    if (flow.exit_disagrees) {
      lines.push(`- Process exit ${flow.process_exit_code} does not match the parsed stream. The process exit wins.`);
    }
    lines.push("");
    if (flow.summary) {
      lines.push(flow.summary.trim());
      lines.push("");
    }
    if (flow.failed_step) {
      lines.push(`### Failed step ${flow.failed_step.step}`);
      lines.push("");
      lines.push(flow.failed_step.remark || "(no remark)");
      lines.push("");
    }
    if (flow.expected != null || flow.actual != null) {
      lines.push("### Expected vs actual");
      lines.push("");
      if (flow.check_name) lines.push(`- Check: ${flow.check_name}`);
      if (flow.operator) lines.push(`- Operator: ${flow.operator}`);
      lines.push(`- Expected: ${show(flow.expected)}`);
      lines.push(`- Actual: ${show(flow.actual)}`);
      if (flow.reasoning) lines.push(`- Kane reasoning: ${flow.reasoning}`);
      lines.push("");
    }
    if (flow.checks?.length) {
      lines.push("### Checks");
      lines.push("");
      for (const check of flow.checks) {
        const mark = check.passed === true ? "pass" : check.passed === false ? "fail" : "unknown";
        lines.push(`- ${mark}: ${check.name} — expected ${show(check.expected)}, actual ${show(check.actual)}`);
      }
      lines.push("");
    }
    if (flow.final_state && Object.keys(flow.final_state).length) {
      lines.push("### Stored values");
      lines.push("");
      for (const [key, value] of Object.entries(flow.final_state)) {
        lines.push(`- ${key}: ${show(value)}`);
      }
      lines.push("");
    }
    lines.push("### Video trace");
    lines.push("");
    lines.push(flow.video_trace || "(none)");
    lines.push("");
    if (flow.evidence_pack) lines.push(`Evidence pack: \`${flow.evidence_pack}\``);
    if (flow.session_dir) lines.push(`Session directory: \`${flow.session_dir}\``);
    if (flow.test_url && flow.test_url !== flow.video_trace) lines.push(`Test Manager: ${flow.test_url}`);
    if (flow.recording?.session_id) {
      lines.push(`Recording: ${flow.recording.enabled ? "on" : "off"}, session ${flow.recording.session_id}`);
    }
    lines.push("");
    if (flow.warnings?.length) {
      lines.push("### Warnings");
      lines.push("");
      for (const warning of flow.warnings) {
        lines.push(`- ${warning.code || "warning"}: ${warning.message}`);
      }
      lines.push("");
    }
    if (flow.errors?.length) {
      lines.push("### Errors");
      lines.push("");
      for (const error of flow.errors) {
        lines.push(`- ${error.message}`);
      }
      lines.push("");
    }
    if (flow.per_flow_metadata?.some((item) => item.error_message)) {
      lines.push("### Flow errors");
      lines.push("");
      for (const item of flow.per_flow_metadata) {
        if (item.error_message) lines.push(`- ${item.error_message}`);
      }
      lines.push("");
    }
    if (flow.spec_steps?.length && flow.verdict === "failed") {
      lines.push("### Spec the agent must keep");
      lines.push("");
      flow.spec_steps.forEach((step, index) => {
        lines.push(`${index + 1}. **${step.heading}** — ${step.body.replace(/\s+/g, " ")}`);
      });
      lines.push("");
    }
    if (flow.command) {
      lines.push("Command:");
      lines.push("");
      lines.push("```");
      lines.push(flow.command);
      lines.push("```");
      lines.push("");
    }
  }

  lines.push("## What the agent should do");
  lines.push("");
  lines.push(report.agent_next);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

export function agentNext(report) {
  if (report.mode === "dry-run") {
    return "This was a dry run. On a machine with Kane CLI signed in, run `node bin/satr-verify.js run --url <url>` and read `.satr/last-run.md`.";
  }
  if (report.verdict === "passed") {
    return "The flows passed. Leave `flows/` as they are. You can tell the user the verdict, the one-line summary, and the video trace.";
  }
  if (report.verdict === "did_not_start") {
    return [
      "Kane did not start a browser run. Do not change the app to satisfy this.",
      "Install `kane-cli`, then sign in with `kane-cli login --oauth`, or export `LT_USERNAME` and `LT_ACCESS_KEY` and run again.",
      "Chrome has to be installed for a local browser run. Exit 2 spends no credits.",
    ].join(" ");
  }
  if (report.verdict === "timeout" || report.verdict === "cancelled") {
    return "The run was cut off. Re-run the same command. If it times out again, split the flow. Do not delete the assertion to make it pass.";
  }
  const failed = report.flows.find((flow) => flow.verdict === "failed");
  const file = failed?.file ?? "the flow";
  const expected = failed?.expected ?? "(see the failed step remark)";
  const actual = failed?.actual ?? "(see the failed step remark)";
  return [
    `Verdict is failed. Read the failed step in \`${file}\`.`,
    `Expected: ${expected}.`,
    `Actual: ${actual}.`,
    "Patch `app/` so a new run would observe the expected text. Do not edit `flows/` to weaken the check.",
    "Re-run the same `satr-verify run` command. Read `.satr/last-run.md` again. Stop when the verdict is passed.",
    "Open the video trace if the remark is not enough to see the page.",
  ].join(" ");
}

function introFor(report) {
  if (report.mode === "dry-run") {
    return "Dry run only. The commands below are what a real run would execute. Use this when Kane credentials are not on the machine.";
  }
  if (report.verdict === "passed") {
    return "Kane ran the flow and the checks passed. The video trace is the share link when Test Manager uploaded the session, otherwise the local evidence pack.";
  }
  if (report.verdict === "did_not_start") {
    return "Kane refused to start. The usual causes are sign-in, Chrome, or a missing start URL. No credits were spent. The app was not judged.";
  }
  if (report.verdict === "timeout" || report.verdict === "cancelled") {
    return "The run stopped before a normal pass or fail. Treat it as unfinished, not as a product bug, unless the summary says the page itself failed.";
  }
  return "Kane started the browser and the flow failed. The expected value and the actual value below are what the agent patches against. The video trace is the link or path to the recording.";
}

function show(value) {
  if (value == null) return "(none)";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function roundCredits(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return String(Math.round(number * 100) / 100);
}
