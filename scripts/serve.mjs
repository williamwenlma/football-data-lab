import { createServer } from 'node:http';
import { createReadStream, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './data.mjs';

const portArg = process.argv.find(arg => arg.startsWith('--port='));
const baseArg = process.argv.find(arg => arg.startsWith('--base='));
const port = Number(portArg?.slice(7) || 4173);
const base = baseArg ? '/' + baseArg.slice(7).replace(/^\/+|\/+$/g, '') + '/' : '/';
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
const root = realpathSync(ROOT);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.csv': 'text/csv', '.md': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer((req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (base !== '/' && pathname === base.slice(0, -1)) { res.writeHead(302, { Location: base }); res.end(); return; }
    if (!pathname.startsWith(base)) throw new Error('Not found');
    const relative = pathname.slice(base.length);
    if (relative.split('/').some(part => part.startsWith('.')) || relative.includes('\\') || relative.includes('\0')) throw new Error('Not found');
    let file = path.resolve(root, relative);
    let rel = path.relative(root, file);
    if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('Not found');
    if (statSync(file).isDirectory()) {
      if (!pathname.endsWith('/')) { res.writeHead(302, { Location: pathname + '/' }); res.end(); return; }
      file = path.join(file, 'index.html');
    }
    file = realpathSync(file);
    rel = path.relative(root, file);
    if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('Not found');
    const type = types[path.extname(file)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type + (type.startsWith('text/') || type.includes('json') ? '; charset=utf-8' : ''), 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
    if (req.method === 'HEAD') res.end();
    else createReadStream(file).on('error', () => res.destroy()).pipe(res);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not found'); }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Football Data Lab: http://127.0.0.1:${port}${base}`));
