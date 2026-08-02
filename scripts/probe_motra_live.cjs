/**
 * Probe live Motra endpoints (read-only GETs) to capture schemas for the
 * endpoints that returned 304 in the HAR capture.
 *
 * Mints a fresh Firebase ID token from .motra_refresh_token, then walks
 * every known endpoint WITHOUT If-None-Match so we get full bodies.
 */
const fs = require('fs');
const path = require('path');

const FIREBASE_API_KEY = 'AIzaSyADtP9ZTyPUIqk7T9xHvEuEXhe--IYYLWw';
const UID = '7u4GLTkWfIMpjJ8GwjTayr52Kkb2';
const REFRESH_TOKEN_FILE = path.join(__dirname, '..', '.motra_refresh_token');
const OUT_DIR = path.join(__dirname, '..', '.har_dump', 'live');

const now = Math.floor(Date.now() / 1000);
const weekAgo = now - 7 * 86400;
const monthAgo = now - 30 * 86400;

const ENDPOINTS = [
  // --- confirmed in HAR, re-pulled for freshness ---
  ['weekly-summary',    `/user/weekly-workout-summary/v3`],
  ['muscle-recovery',   `/user/muscle-recovery`],
  ['stats-overall-7d',  `/user/stats/overall?startTimestamp=${weekAgo}&endTimestamp=${now}`],
  ['stats-trends-7d',   `/stats/trends/v2?startTimestamp=${weekAgo}&endTimestamp=${now}`],
  ['stats-muscle-grp',  `/user/stats/muscle-group?startTimestamp=${weekAgo}&endTimestamp=${now}`],
  ['calendar-workouts', `/user/calendar-workouts/v3?startTimestamp=${monthAgo}&endTimestamp=${now}`],

  // --- were 304 in HAR, schema unknown ---
  ['workouts-list',     `/user/${UID}/workouts/v2/?size=20`],
  ['workout-count',     `/user/workout/count`],
  ['activity',          `/user/activity?size=16`],
  ['feed',              `/user/feed/v2?size=20`],
  ['profile-header',    `/user/profile/${UID}/header-details`],
  ['my-templates',      `/user/template/my-templates?size=10&sortBy=matchScore`],
  ['custom-exercise',   `/custom-exercise?limit=60&sortBy=createdAt&sortDirection=desc`],
  ['favourite-ex-ids',  `/exercise/favourite-exercise-ids`],
];

async function mintToken() {
  const refreshToken = fs.readFileSync(REFRESH_TOKEN_FILE, 'utf8').trim();
  const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
  });
  if (!res.ok) throw new Error(`token refresh failed: ${res.status} ${await res.text()}`);
  const j = await res.json();
  if (j.refresh_token && j.refresh_token !== refreshToken) {
    fs.writeFileSync(REFRESH_TOKEN_FILE, j.refresh_token);
    console.log('   (refresh token rotated, saved)');
  }
  return j.id_token;
}

async function probe(idToken, [label, pathAndQuery]) {
  const res = await fetch(`https://backend.motra.com${pathAndQuery}`, {
    headers: {
      'Accept': '*/*',
      'Accept-Language': 'en-IN,en;q=0.9',
      'User-Agent': 'Motra/1 CFNetwork/3892.100.1 Darwin/27.0.0',
      'Authorization': `Bearer ${idToken}`,
    },
  });
  const text = await res.text();
  fs.writeFileSync(path.join(OUT_DIR, `${label}.json`), text);
  return { label, pathAndQuery, status: res.status, bytes: text.length, text };
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('Minting fresh ID token...');
  const idToken = await mintToken();
  console.log('Token OK.\n');

  for (const ep of ENDPOINTS) {
    try {
      const r = await probe(idToken, ep);
      console.log(`${'='.repeat(72)}\n${r.status}  ${r.label.padEnd(18)} ${r.bytes}b   ${r.pathAndQuery}\n${'='.repeat(72)}`);
      try {
        const j = JSON.parse(r.text);
        const s = JSON.stringify(j, null, 2);
        console.log(s.length > 2200 ? s.slice(0, 2200) + '\n  ...[truncated]' : s);
      } catch {
        console.log(r.text.slice(0, 600));
      }
      console.log('');
    } catch (err) {
      console.log(`ERR  ${ep[0]}: ${err.message}\n`);
    }
  }
})();
