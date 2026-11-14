import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function frame(message) {
  const json = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`;
}

function readFrames(child) {
  let buffer = Buffer.alloc(0);
  const frames = [];
  let pending = null;
  child.stdout.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) break;
      const header = buffer.slice(0, headerEnd).toString("utf8");
      const match = /Content-Length:\s*(\d+)/i.exec(header);
      if (!match) break;
      const length = Number(match[1]);
      const start = headerEnd + 4;
      if (buffer.length < start + length) break;
      frames.push(JSON.parse(buffer.slice(start, start + length).toString("utf8")));
      buffer = buffer.slice(start + length);
      if (pending && frames.length >= pending.need) pending.resolve(frames);
    }
  });
  return {
    frames,
    wait(need) {
      if (frames.length >= need) return Promise.resolve(frames);
      return new Promise((resolve) => {
        pending = { need, resolve };
      });
    },
  };
}

test("verify_with_kane is listed and returns a dry-run report", async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "satr-mcp-"));
  const child = spawn(process.execPath, ["bin/satr-verify.js", "mcp"], {
    cwd: root,
    env: { ...process.env, SATR_OUT_DIR: out },
    stdio: ["pipe", "pipe", "pipe"],
  });
  const reader = readFrames(child);
  child.stdin.write(
    frame({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "0" } },
    }),
  );
  child.stdin.write(frame({ jsonrpc: "2.0", id: 2, method: "tools/list" }));
  child.stdin.write(
    frame({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "verify_with_kane", arguments: { dry_run: true, url: "https://barood-labs.github.io/satr-verify/" } },
    }),
  );
  const frames = await reader.wait(3);
  child.stdin.end();
  await new Promise((resolve) => child.on("close", resolve));
  assert.equal(frames[0].result.serverInfo.name, "satr-verify");
  assert.equal(frames[1].result.tools[0].name, "verify_with_kane");
  assert.match(frames[2].result.content[0].text, /Verdict: \*\*dry_run\*\*/);
  assert.equal(frames[2].result.isError, false);
});
