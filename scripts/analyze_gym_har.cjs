/**
 * Analyze a ProxyPin HAR capture and list every endpoint,
 * grouped by host, with method / status / response size.
 */
const fs = require('fs');

const harPath = process.argv[2];
if (!harPath) {
  console.error('usage: node analyze_gym_har.cjs <file.har> [--host substr]');
  process.exit(1);
}

const hostFilter = process.argv.includes('--host')
  ? process.argv[process.argv.indexOf('--host') + 1]
  : null;

const har = JSON.parse(fs.readFileSync(harPath, 'utf8'));
const entries = har.log?.entries || [];

console.log(`Total entries: ${entries.length}\n`);

const byHost = {};
for (const e of entries) {
  let u;
  try { u = new URL(e.request.url); } catch { continue; }
  if (hostFilter && !u.hostname.includes(hostFilter)) continue;
  (byHost[u.hostname] ||= []).push({
    method: e.request.method,
    path: u.pathname,
    query: u.search,
    status: e.response?.status,
    size: e.response?.content?.size ?? 0,
    mime: e.response?.content?.mimeType || '',
    hasBody: !!e.response?.content?.text,
  });
}

for (const host of Object.keys(byHost).sort()) {
  console.log(`\n${'='.repeat(70)}\nHOST: ${host}  (${byHost[host].length} requests)\n${'='.repeat(70)}`);
  const seen = new Map();
  for (const r of byHost[host]) {
    const key = `${r.method} ${r.path}`;
    if (!seen.has(key)) seen.set(key, { ...r, count: 0 });
    const s = seen.get(key);
    s.count++;
    if (r.size > s.size) { s.size = r.size; s.query = r.query; s.hasBody = r.hasBody; }
  }
  for (const [key, r] of [...seen.entries()].sort((a, b) => b[1].size - a[1].size)) {
    console.log(
      `${String(r.status).padEnd(4)} ${key.padEnd(52)} ${String(r.size).padStart(8)}b  x${r.count}` +
      `${r.hasBody ? '' : '  [no body]'}${r.query ? `\n       query: ${r.query}` : ''}`
    );
  }
}
