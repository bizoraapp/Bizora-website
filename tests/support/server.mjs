/**
 * Tiny static server for the browser tests. Serves the repo root and applies
 * the same security headers as netlify.toml ("/*"), so CSP violations seen in
 * tests are the ones production would produce.
 */
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain" };

export function netlifyHeaders(root = ROOT) {
  const toml = readFileSync(join(root, "netlify.toml"), "utf8");
  const block = toml.split('for = "/*"')[1].split("[[headers]]")[0];
  return Object.fromEntries([...block.matchAll(/^\s+([A-Za-z-]+) = "([^"]+)"/gm)].map((m) => [m[1], m[2]]));
}

export async function startServer(root = ROOT) {
  const headers = netlifyHeaders(root);
  const server = createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    let p = join(root, url);
    if (url.endsWith("/")) p = join(p, "index.html");
    if (!p.startsWith(root) || !existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404, headers); return res.end("not found"); }
    res.writeHead(200, { ...headers, "Content-Type": MIME[extname(p)] || "application/octet-stream" });
    res.end(readFileSync(p));
  }).listen(0);
  await new Promise((r) => server.once("listening", r));
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}
