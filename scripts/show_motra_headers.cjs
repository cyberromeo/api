const fs = require('fs');
const har = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const seen = new Set();
for (const e of har.log.entries) {
  let u; try { u = new URL(e.request.url); } catch { continue; }
  if (u.hostname !== 'backend.motra.com') continue;
  const k = e.request.headers.map(h => h.name.toLowerCase()).sort().join(',');
  if (seen.has(k)) continue;
  seen.add(k);
  console.log(`\n=== ${e.request.method} ${u.pathname} ===`);
  for (const h of e.request.headers) {
    const v = /authorization/i.test(h.name) ? h.value.slice(0, 22) + '...[truncated]' : h.value;
    console.log(`  ${h.name}: ${v}`);
  }
}
