import path from "node:path";
import { discoverFlows } from "./flows.js";
import { installHook, uninstallHook } from "./hook.js";
import { startMcp } from "./mcp.js";
import { PAGES_URL, executeRun } from "./run.js";
import { startServer } from "./serve.js";
import { watchAndRun } from "./watch.js";

export function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--") continue;
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next == null || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

export async function main(argv) {
  const args = parseArgs(argv);
  let command = args._[0];
  if (args.help || args.h || command === "help") {
    process.stdout.write(helpText());
    return 0;
  }
  if (!command) command = "run";
  const root = process.cwd();
  const url = args.url || (args.pages ? PAGES_URL : undefined);
  const common = {
    root,
    url,
    flow: args.flow,
    dryRun: Boolean(args["dry-run"]),
    fixture: args.fixture,
    stderrFixture: args["stderr-fixture"],
    exitCode: args["exit-code"] != null ? Number(args["exit-code"]) : undefined,
    headless: !args.headed,
    timeout: args.timeout != null ? Number(args.timeout) : undefined,
    username: args.username,
    accessKey: args["access-key"],
    outDir: args.out ? path.resolve(root, args.out) : undefined,
    port: args.port != null ? Number(args.port) : undefined,
  };

  if (command === "run") {
    const result = await executeRun(common);
    process.stdout.write(`${result.mdPath}\n`);
    return result.exitCode;
  }
  if (command === "serve") {
    const started = await startServer({ root: path.join(root, "app"), port: common.port ?? 4173 });
    process.stdout.write(`${started.url}\n`);
    await new Promise((resolve) => {
      process.once("SIGINT", () => {
        started.close().then(resolve);
      });
    });
    return 0;
  }
  if (command === "watch") {
    process.stderr.write("satr-verify: watching app/ and flows/. Ctrl-C stops.\n");
    const watcher = watchAndRun({
      root,
      run: async () => {
        const result = await executeRun(common);
        process.stderr.write(`${result.mdPath} (${result.report.verdict})\n`);
      },
    });
    await new Promise((resolve) => {
      process.once("SIGINT", () => {
        watcher.close();
        resolve();
      });
    });
    return 0;
  }
  if (command === "hook") {
    const action = args._[1] || "install";
    if (action === "install") {
      const dest = installHook(root);
      process.stdout.write(`Installed pre-push hook at ${dest}\n`);
      process.stdout.write("SATR_VERIFY_DRY_RUN=1 skips Kane. SATR_VERIFY_SKIP=1 skips the hook.\n");
      return 0;
    }
    if (action === "uninstall") {
      const removed = uninstallHook(root);
      process.stdout.write(removed ? "Removed the satr-verify pre-push hook.\n" : "No satr-verify pre-push hook was installed.\n");
      return 0;
    }
    if (action === "run") {
      const result = await executeRun(common);
      process.stdout.write(`${result.mdPath}\n`);
      return result.exitCode;
    }
    process.stderr.write("Use: satr-verify hook install | uninstall | run\n");
    return 2;
  }
  if (command === "mcp") {
    startMcp({ root });
    await new Promise((resolve) => {
      process.stdin.on("end", resolve);
      process.stdin.on("close", resolve);
    });
    return 0;
  }
  if (command === "flows") {
    const flows = discoverFlows(root, { flow: args.flow });
    for (const flow of flows) process.stdout.write(`${flow.kind}\t${flow.file}\n`);
    return flows.length ? 0 : 2;
  }
  process.stderr.write(`Unknown command ${command}\n\n${helpText()}`);
  return 2;
}

function helpText() {
  return `satr-verify — run Kane CLI against the Satr paperwork helper and write .satr/last-run.md

Usage
  satr-verify run [--url URL] [--flow FILE] [--dry-run] [--fixture NDJSON]
  satr-verify serve [--port 4173]
  satr-verify watch [--url URL] [--dry-run]
  satr-verify hook install
  satr-verify mcp
  satr-verify flows

Auth
  kane-cli login --oauth
  or export LT_USERNAME and LT_ACCESS_KEY (passed as --username and --access-key)
  TESTMUAI_BASIC_AUTH (base64 of username:accessKey) is also accepted.
  Credentials are never written to the report.

A real run, from a machine that has Kane credits:
  node bin/satr-verify.js run --url ${PAGES_URL}

The agent reads .satr/last-run.md, patches app/, and runs the same command again.
`;
}
