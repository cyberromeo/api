/**
 * Dump response bodies for backend.motra.com entries in a HAR,
 * plus extract the newest Firebase refresh token from securetoken responses.
 */
const fs = require('fs');
const path = require('path');

const harPath = process.argv[2];
const har = JSON.parse(fs.readFileSync(harPath, 'utf8'));
const entries = har.log?.entries || [];

const outDir = path.join(__dirname, '..', '.har_dump');
fs.mkdirSync(outDir, { recursive: true });

let newestToken = null;
let newestTokenTime = 0;

for (const e of entries) {
  let u;
  try { u = new URL(e.request.url); } catch { continue; }
  const body = e.response?.content?.text;

  if (u.hostname === 'securetoken.googleapis.com' && body) {
    try {
      const j = JSON.parse(body);
      const t = new Date(e.startedDateTime).getTime();
      if (j.refresh_token && t > newestTokenTime) {
        newestTokenTime = t;
        newestToken = j.refresh_token;
      }
    } catch {}
    continue;
  }

  if (u.hostname !== 'backend.motra.com' || !body) continue;

  const safe = `${e.request.method}_${u.pathname.replace(/[^a-z0-9]/gi, '_')}`.slice(0, 90);
  fs.writeFileSync(path.join(outDir, `${safe}.json`), body);
  console.log(`\n${'#'.repeat(72)}`);
  console.log(`# ${e.request.method} ${u.pathname}${u.search}`);
  console.log(`# status ${e.response.status}   ${body.length} bytes`);
  console.log('#'.repeat(72));
  try {
    console.log(JSON.stringify(JSON.parse(body), null, 2));
  } catch {
    console.log(body.slice(0, 3000));
  }
}

if (newestToken) {
  const f = path.join(__dirname, '..', '.motra_refresh_token.new');
  fs.writeFileSync(f, newestToken);
  console.log(`\n\n>>> Extracted refresh token from HAR (${newestToken.length} chars) -> .motra_refresh_token.new`);
  console.log(`>>> captured at ${new Date(newestTokenTime).toISOString()}`);
}
