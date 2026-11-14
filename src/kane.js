import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { redactCommand } from "./redact.js";
import { substituteBaseUrl } from "./flows.js";

export function kaneAuthFromEnv(env = process.env, flags = {}) {
  if (flags.username || flags.accessKey) {
    if (!flags.username || !flags.accessKey) {
      return { error: "Pass both --username and --access-key, or neither." };
    }
    return { username: flags.username, accessKey: flags.accessKey, source: "flags" };
  }
  if (env.LT_USERNAME || env.LT_ACCESS_KEY) {
    if (!env.LT_USERNAME || !env.LT_ACCESS_KEY) {
      return {
        error: "Set both LT_USERNAME and LT_ACCESS_KEY, or unset both to use a saved `kane-cli login`.",
      };
    }
    return { username: env.LT_USERNAME, accessKey: env.LT_ACCESS_KEY, source: "LT_USERNAME" };
  }
  if (env.TESTMUAI_BASIC_AUTH) {
    const decoded = Buffer.from(env.TESTMUAI_BASIC_AUTH, "base64").toString("utf8");
    const splitAt = decoded.indexOf(":");
    if (splitAt <= 0 || !decoded.slice(splitAt + 1)) {
      return { error: "TESTMUAI_BASIC_AUTH must be base64 of username:accessKey." };
    }
    return {
      username: decoded.slice(0, splitAt),
      accessKey: decoded.slice(splitAt + 1),
      source: "TESTMUAI_BASIC_AUTH",
    };
  }
  return { source: "saved-login" };
}

export function buildKaneInvocation({ bin = "kane-cli", flow, url, auth, headless = true, timeout = 150, variablesFile }) {
  const args = [];
  if (flow.kind === "testmd") {
    args.push("testmd", "run", flow.path, "--agent");
    if (headless) args.push("--headless");
    if (timeout) args.push("--timeout", String(timeout));
    args.push("--url", url);
    if (variablesFile) args.push("--variables-file", variablesFile);
  } else {
    const objective = substituteBaseUrl(flow.objective, url);
    args.push("run", objective, "--agent", "--url", url);
    if (headless) args.push("--headless");
    if (timeout) args.push("--timeout", String(timeout));
  }
  if (auth?.username) args.push("--username", auth.username, "--access-key", auth.accessKey);
  return {
    bin,
    args,
    timeoutSeconds: 10 * 60,
    display: redactCommand([bin, ...args], [auth?.username, auth?.accessKey]),
    env: { KANE_CLI_USER_AGENT: "satr-verify" },
  };
}

export function writeVariablesFile(url) {
  const file = path.join(os.tmpdir(), `satr-verify-${process.pid}-${Date.now()}.json`);
  const body = JSON.stringify({ base_url: { value: url } });
  fs.writeFileSync(file, body, { mode: 0o600 });
  return file;
}

export function runKane(invocation, { spawnImpl = spawn, env = process.env, mirrorStderr = true } = {}) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawnImpl(invocation.bin, invocation.args, {
        env: { ...env, ...invocation.env },
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      resolve({ stdout: "", stderr: error.message, exitCode: 2, spawnError: error.message });
      return;
    }
    if (!child || typeof child.on !== "function") {
      resolve({ stdout: "", stderr: "Unable to start Kane CLI.", exitCode: 2, spawnError: "spawn failed" });
      return;
    }
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish({ stdout, stderr: `${stderr}\nSatr Verify killed the run after ${invocation.timeoutSeconds}s.`, exitCode: 3 });
    }, invocation.timeoutSeconds * 1000);
    child.stdout?.setEncoding?.("utf8");
    child.stderr?.setEncoding?.("utf8");
    child.stdout?.on?.("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on?.("data", (chunk) => {
      stderr += chunk;
      if (mirrorStderr) process.stderr.write(chunk);
    });
    child.on("error", (error) => {
      const missing = error.code === "ENOENT";
      const message = missing
        ? "kane-cli was not found on PATH. Install it with: npm install -g @testmuai/kane-cli"
        : error.message;
      finish({ stdout, stderr: message, exitCode: 2, spawnError: message });
    });
    child.on("close", (code, signal) => {
      finish({ stdout, stderr, exitCode: code ?? (signal ? 3 : 1) });
    });
  });
}
