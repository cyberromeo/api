const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const SERVICE_ACCOUNT_FILE = process.env.FIREBASE_SERVICE_ACCOUNT || '../epaper-api-key-firebase-adminsdk-fbsvc-14ee0d69d4.json';

if (!getApps().length) {
  const serviceAccountPath = path.resolve(__dirname, SERVICE_ACCOUNT_FILE);
  const serviceAccount = require(serviceAccountPath);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function inspectMotra() {
  console.log("🔍 Inspecting Firestore 'api_feeds/motra_metrics'...");
  const snap = await db.collection('api_feeds').doc('motra_metrics').get();
  if (snap.exists) {
    console.log("📦 MOTRA FIRESTORE DOC:\n", JSON.stringify(snap.data(), null, 2));
  } else {
    console.log("❌ Document 'api_feeds/motra_metrics' does NOT exist!");
  }
  process.exit(0);
}

inspectMotra();
