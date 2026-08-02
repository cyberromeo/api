/**
 * Cronicle Worker Script: Motra Full Gym Sync
 *
 * Pulls the complete gym dataset from backend.motra.com — weekly stats,
 * workouts, muscle groups, streak, leaderboard, PRs, and muscle recovery —
 * and writes it to Firestore: api_feeds/motra_metrics
 *
 * Auth is self-refreshing: a long-lived Firebase refresh token mints a fresh
 * 60-minute ID token on every run, so this never needs re-authentication.
 *
 * Run locally:  node scripts/motra_worker.cjs
 *               node scripts/motra_worker.cjs --dry-run   (fetch only, no write)
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const { mintIdToken, fetchAllGymData, logPayloadSummary } = require('./motra_fetch_core.cjs');

const DRY_RUN = process.argv.includes('--dry-run');
const REFRESH_TOKEN_FILE = path.resolve(__dirname, '..', '.motra_refresh_token');
const SERVICE_ACCOUNT_FILE =
  process.env.FIREBASE_SERVICE_ACCOUNT ||
  '../epaper-api-key-firebase-adminsdk-fbsvc-14ee0d69d4.json';

function loadRefreshToken() {
  if (process.env.MOTRA_REFRESH_TOKEN) return process.env.MOTRA_REFRESH_TOKEN.trim();
  if (fs.existsSync(REFRESH_TOKEN_FILE)) return fs.readFileSync(REFRESH_TOKEN_FILE, 'utf8').trim();
  throw new Error(
    'No Motra refresh token. Set MOTRA_REFRESH_TOKEN or create .motra_refresh_token'
  );
}

function initFirebase() {
  if (getApps().length) return true;
  try {
    const serviceAccount = require(path.resolve(__dirname, SERVICE_ACCOUNT_FILE));
    initializeApp({ credential: cert(serviceAccount) });
    console.log('⚡ Firebase Admin initialized');
    return true;
  } catch (err) {
    console.error('❌ Failed to load Firebase service account:', err.message);
    return false;
  }
}

async function main() {
  console.log(`📡 Motra Full Gym Sync — ${new Date().toISOString()}`);

  // 1. fresh ID token
  const refreshToken = loadRefreshToken();
  const tokens = await mintIdToken(refreshToken);
  console.log(`🔑 ID token minted for user ${tokens.userId}`);

  // Firebase occasionally rotates the refresh token — persist it if so
  if (tokens.refreshToken && tokens.refreshToken !== refreshToken) {
    fs.writeFileSync(REFRESH_TOKEN_FILE, tokens.refreshToken);
    console.log('🔁 Refresh token rotated and saved');
  }

  // 2. pull everything
  const payload = await fetchAllGymData(tokens.idToken);
  logPayloadSummary(payload);

  if (!payload.meta.endpointsOk.length) {
    throw new Error('All Motra endpoints failed — refusing to overwrite Firestore');
  }

  if (DRY_RUN) {
    console.log('\n🧪 --dry-run: skipping Firestore write');
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  // 3. write to Firestore
  if (!initFirebase()) process.exit(1);
  const db = getFirestore();
  await db.collection('api_feeds').doc('motra_metrics').set(
    {
      apiName: 'MOTRA',
      source: 'Motra Fitness API (full gym sync)',
      timestamp: FieldValue.serverTimestamp(),
      status: 'success',
      payload: payload,
    },
    { merge: true }
  );

  console.log("✅ Firestore updated: api_feeds/motra_metrics");
}

main().catch((err) => {
  console.error('❌ Motra sync failed:', err.message);
  process.exit(1);
});
