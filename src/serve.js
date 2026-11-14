import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
};

export function startServer({ root, port = 4173, host = "127.0.0.1" } = {}) {
  const appRoot = path.resolve(root ?? path.join(process.cwd(), "app"));
  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    const relative = pathname.replace(/^\/+/, "");
    const file = path.resolve(appRoot, relative);
    if (file !== appRoot && !file.startsWith(`${appRoot}${path.sep}`)) {
      response.writeHead(400);
      response.end("Bad path");
      return;
    }
    fs.readFile(file, (error, data) => {
      if (error) {
        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }
      const type = TYPES[path.extname(file)] ?? "application/octet-stream";
      response.writeHead(200, { "content-type": type, "cache-control": "no-cache" });
      response.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      resolve({
        server,
        port: address.port,
        url: `http://${host}:${address.port}/`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}
