import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml"]
]);

const server = createServer(async (request, response) => {
  if (request.method !== "GET") {
    response.writeHead(405).end("Only GET is supported.");
    return;
  }
  const pathname = new URL(request.url, "http://127.0.0.1").pathname;
  const relativePath = pathname === "/" ? "demo.html" : pathname.slice(1);
  const filePath = path.resolve(root, relativePath);
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end("Forbidden.");
    return;
  }
  try {
    const body = await readFile(filePath);
    response.writeHead(200, { "content-type": contentTypes.get(path.extname(filePath)) ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404).end("Not found.");
  }
});

server.listen(4173, "127.0.0.1", () => console.log("Demo available at http://127.0.0.1:4173/"));
