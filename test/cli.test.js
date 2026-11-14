import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { executeRun } from "../src/run.js";
import { buildKaneInvocation, kaneAuthFromEnv } from "../src/kane.js";
import { discoverFlows, readFlowSteps } from "../src/flows.js";
import { startServer } from "../src/serve.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("discovers the committed flows and keeps base_url out of frontmatter", () => {
  const flows = discoverFlows(root);
  const files = flows.map((flow) => flow.file);
  for (const name of [
    "flows/arabic-toggle_test.md",
    "flows/check-document_test.md",
    "flows/open-checklist_test.md",
  ]) {
    assert.ok(files.includes(name), name);
  }
  for (const flow of flows) {
    const text = fs.readFileSync(flow.path, "utf8");
    assert.match(text, /^---\n[\s\S]*?\n---\n/);
    assert.match(text, /^## /m);
    assert.doesNotMatch(text, /base_url:/);
    assert.match(text, /\{\{base_url\}\}/);
    assert.ok(readFlowSteps(text).length >= 2);
  }
});

test("auth comes from LT_USERNAME and LT_ACCESS_KEY, and the report redacts them", async () => {
  const auth = kaneAuthFromEnv({ LT_USERNAME: "ada@example.com", LT_ACCESS_KEY: "super-secret-key" });
  assert.equal(auth.source, "LT_USERNAME");
  const flow = discoverFlows(root)[0];
  const invocation = buildKaneInvocation({
    bin: "kane-cli",
    flow,
    url: "https://barood-labs.github.io/satr-verify/",
    auth,
    variablesFile: "/tmp/vars.json",
  });
  assert.match(invocation.display, /--agent/);
  assert.match(invocation.display, /--headless/);
  assert.match(invocation.display, /--username \*\*\*/);
  assert.doesNotMatch(invocation.display, /super-secret-key/);
  assert.doesNotMatch(invocation.display, /ada@example.com/);
  const partial = kaneAuthFromEnv({ LT_USERNAME: "only-user" });
  assert.match(partial.error, /LT_ACCESS_KEY/);
  const basic = kaneAuthFromEnv({
    TESTMUAI_BASIC_AUTH: Buffer.from("sam:key-123").toString("base64"),
  });
  assert.equal(basic.username, "sam");
  assert.equal(basic.accessKey, "key-123");
  assert.equal(kaneAuthFromEnv({}).source, "saved-login");
});

test("fixture mode writes the failure report the agent reads", async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "satr-report-"));
  const result = await executeRun({
    root,
    url: "https://barood-labs.github.io/satr-verify/",
    fixture: path.join(root, "test/fixtures/arabic-heading-mismatch.ndjson"),
    flow: "arabic-toggle_test.md",
    outDir: out,
    mirrorStderr: false,
  });
  assert.equal(result.exitCode, 1);
  const markdown = fs.readFileSync(result.mdPath, "utf8");
  const json = JSON.parse(fs.readFileSync(result.jsonPath, "utf8"));
  assert.match(markdown, /Verdict: \*\*failed\*\*/);
  assert.match(markdown, /Failed step 4/);
  assert.match(markdown, /Expected: استخراج بطاقة هوية الولاية/);
  assert.match(markdown, /Actual: Get a state ID/);
  assert.match(markdown, /Video trace/);
  assert.match(markdown, /SHARE_FIXTURE_ARABIC_MISMATCH/);
  assert.match(markdown, /Do not edit `flows\/`/);
  assert.equal(json.flows[0].result_code, 710);
  assert.equal(json.flows[0].file, "flows/arabic-toggle_test.md");
  assert.ok(json.flows[0].spec_steps.length >= 2);
});

test("--serve runs against the local server in this process", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "satr-serve-"));
  const ran = spawnSync(
    process.execPath,
    ["bin/satr-verify.js", "run", "--serve", "--port", "0", "--dry-run", "--out", out],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(ran.status, 0, ran.stderr);
  assert.match(ran.stderr, /serving http:\/\/127\.0\.0\.1:\d+\//);
  const markdown = fs.readFileSync(path.join(out, "last-run.md"), "utf8");
  assert.match(markdown, /URL: http:\/\/127\.0\.0\.1:\d+/);
  assert.doesNotMatch(markdown, /Run directory/);
});

test("dry-run does not launch Kane and exits 0", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "satr-dry-"));
  const ran = spawnSync(process.execPath, ["bin/satr-verify.js", "run", "--dry-run", "--out", out], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(ran.status, 0, ran.stderr);
  const markdown = fs.readFileSync(path.join(out, "last-run.md"), "utf8");
  assert.match(markdown, /Verdict: \*\*dry_run\*\*/);
  assert.match(markdown, /Kane CLI was not started/);
  assert.match(markdown, /arabic-toggle_test.md/);
  assert.match(markdown, /--agent/);
});

test("a fake kane-cli binary is parsed and its access key stays out of the report", async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "satr-fake-"));
  const argvFile = path.join(out, "argv.json");
  const result = await executeRun({
    root,
    url: "https://barood-labs.github.io/satr-verify/",
    flow: "open-checklist_test.md",
    outDir: out,
    kaneBin: process.execPath,
    env: {
      ...process.env,
      LT_USERNAME: "ada@example.com",
      LT_ACCESS_KEY: "super-secret-key",
      SATR_FAKE_STDOUT: path.join(root, "test/fixtures/warmup.ndjson"),
      SATR_FAKE_EXIT: "0",
      SATR_FAKE_ARGV: argvFile,
    },
    spawnImpl: (bin, args, options) => {
      assert.equal(bin, process.execPath);
      return spawn(bin, [path.join(root, "scripts/fake-kane.js"), ...args], options);
    },
    mirrorStderr: false,
  });
  assert.equal(result.exitCode, 0);
  const argv = JSON.parse(fs.readFileSync(argvFile, "utf8"));
  assert.ok(argv.includes("--agent"));
  assert.ok(argv.includes("--headless"));
  assert.ok(argv.includes("testmd"));
  assert.ok(argv.includes("--access-key"));
  assert.ok(argv.includes("super-secret-key"));
  const variablesFlag = argv[argv.indexOf("--variables-file") + 1];
  assert.equal(fs.existsSync(variablesFlag), false);
  const markdown = fs.readFileSync(result.mdPath, "utf8");
  assert.match(markdown, /Verdict: \*\*passed\*\*/);
  assert.match(markdown, /Example Domain/);
  assert.doesNotMatch(markdown, /super-secret-key/);
  assert.doesNotMatch(JSON.stringify(result.report), /super-secret-key/);
});

test("the static server serves both languages", async () => {
  const started = await startServer({ root: path.join(root, "app"), port: 0 });
  try {
    const html = await fetch(started.url).then((response) => response.text());
    assert.match(html, /id="lang-toggle"/);
    assert.match(html, /العربية/);
    const tasks = await fetch(new URL("tasks.js", started.url)).then((response) => response.text());
    assert.match(tasks, /Get a state ID/);
    assert.match(tasks, /استخراج بطاقة هوية الولاية/);
    assert.match(tasks, /من اليمين إلى اليسار/);
    const css = await fetch(new URL("styles.css", started.url));
    assert.equal(css.status, 200);
    const escaped = await new Promise((resolve, reject) => {
      const request = http.request(
        { hostname: "127.0.0.1", port: started.port, path: "/%2e%2e%2fpackage.json" },
        (response) => {
          response.resume();
          resolve(response.statusCode);
        },
      );
      request.on("error", reject);
      request.end();
    });
    assert.equal(escaped, 400);
  } finally {
    await started.close();
  }
});
