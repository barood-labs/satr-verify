import { executeRun } from "./run.js";

const TOOL = {
  name: "verify_with_kane",
  description:
    "Run the Satr Verify Kane CLI flows against a URL and return a compact report: failed step, expected versus actual, and the video trace. The agent patches app/ from that report and calls this again until the verdict is passed. Pass dry_run or fixture when Kane credentials are not available. Never pass access keys in arguments; the tool reads LT_USERNAME and LT_ACCESS_KEY from the environment, or uses a saved kane-cli login.",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "Page to open. Use the GitHub Pages URL or http://127.0.0.1:4173 while serve is running.",
      },
      flow: {
        type: "string",
        description: "Optional flow file name under flows/, for example arabic-toggle_test.md.",
      },
      dry_run: {
        type: "boolean",
        description: "Plan the Kane commands and write the report without launching Kane CLI.",
      },
      fixture: {
        type: "string",
        description: "Path to Kane --agent NDJSON to parse instead of launching Kane CLI.",
      },
    },
  },
};

export function startMcp({ stdin = process.stdin, stdout = process.stdout, root = process.cwd(), run = executeRun } = {}) {
  let buffer = Buffer.alloc(0);

  const onData = (chunk) => {
    buffer = Buffer.concat([buffer, Buffer.from(chunk)]);
    drain();
  };
  stdin.on("data", onData);

  function drain() {
    while (buffer.length) {
      const asText = buffer.toString("utf8");
      if (asText.startsWith("Content-Length")) {
        const headerEnd = buffer.indexOf("\r\n\r\n");
        if (headerEnd === -1) return;
        const header = buffer.slice(0, headerEnd).toString("utf8");
        const match = /Content-Length:\s*(\d+)/i.exec(header);
        if (!match) {
          buffer = buffer.slice(headerEnd + 4);
          continue;
        }
        const length = Number(match[1]);
        const start = headerEnd + 4;
        if (buffer.length < start + length) return;
        const body = buffer.slice(start, start + length).toString("utf8");
        buffer = buffer.slice(start + length);
        receive(body);
        continue;
      }
      const newline = buffer.indexOf("\n");
      if (newline === -1) return;
      const line = buffer.slice(0, newline).toString("utf8").trim();
      buffer = buffer.slice(newline + 1);
      if (line) receive(line);
    }
  }

  async function receive(body) {
    let message;
    try {
      message = JSON.parse(body);
    } catch {
      return;
    }
    const response = await handleMessage(message, { root, run });
    if (response) writeMessage(stdout, response);
  }

  return {
    close() {
      stdin.off("data", onData);
    },
  };
}

export async function handleMessage(message, { root, run }) {
  if (!message || message.jsonrpc !== "2.0") return null;
  const { id, method, params } = message;
  if (id == null) return null;
  try {
    if (method === "initialize") {
      return result(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "satr-verify", version: "0.1.0" },
      });
    }
    if (method === "ping") return result(id, {});
    if (method === "tools/list") return result(id, { tools: [TOOL] });
    if (method === "tools/call") {
      const name = params?.name;
      if (name !== TOOL.name) {
        return error(id, -32602, `Unknown tool ${name}`);
      }
      const args = params?.arguments ?? {};
      const executed = await run({
        root,
        url: args.url,
        flow: args.flow,
        dryRun: Boolean(args.dry_run),
        fixture: args.fixture,
        outDir: process.env.SATR_OUT_DIR,
        mirrorStderr: false,
      });
      const markdown = (await import("node:fs")).readFileSync(executed.mdPath, "utf8");
      return result(id, {
        content: [{ type: "text", text: markdown }],
        isError: false,
      });
    }
    return error(id, -32601, `Method not found: ${method}`);
  } catch (err) {
    return error(id, -32000, err instanceof Error ? err.message : String(err));
  }
}

function result(id, value) {
  return { jsonrpc: "2.0", id, result: value };
}

function error(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function writeMessage(stdout, message) {
  const json = JSON.stringify(message);
  stdout.write(`Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`);
}
