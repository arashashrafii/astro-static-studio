import http from 'node:http';
import { readFile } from 'node:fs/promises';
const types = { html: 'text/html', mjs: 'text/javascript', wasm: 'application/wasm' };
export const server = http.createServer(async (req, res) => {
  const name = req.url === '/' ? 'index.html' : req.url.slice(1);
  if (!/^[a-z-]+\.(html|mjs|wasm)$/.test(name)) { res.writeHead(404).end(); return; }
  try {
    const bytes = await readFile(new URL(`./dist/${name}`, import.meta.url));
    res.writeHead(200, { 'Content-Type': types[name.split('.').pop()], 'Content-Security-Policy': "default-src 'self'; script-src 'self' blob: 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self' blob:; style-src 'unsafe-inline'; frame-src 'self' about:; object-src 'none'; base-uri 'none'" });
    res.end(bytes);
  } catch { res.writeHead(404).end(); }
});
if (process.argv[1]?.endsWith('/serve.mjs')) server.listen(4174, '127.0.0.1', () => console.log('Static files only: http://127.0.0.1:4174'));
