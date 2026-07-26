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

async function inspectSchedule() {
  console.log("🔍 Inspecting Firestore 'api_feeds/class_schedule' and 'api_feeds/exams_schedule'...");

  const classSnap = await db.collection('api_feeds').doc('class_schedule').get();
  if (classSnap.exists) {
    console.log("📦 CLASS SCHEDULE DOC:", JSON.stringify(classSnap.data(), null, 2));
  } else {
    console.log("❌ Document 'api_feeds/class_schedule' does NOT exist!");
  }

  const examsSnap = await db.collection('api_feeds').doc('exams_schedule').get();
  if (examsSnap.exists) {
    console.log("📦 EXAMS SCHEDULE DOC:", JSON.stringify(examsSnap.data(), null, 2));
  } else {
    console.log("❌ Document 'api_feeds/exams_schedule' does NOT exist!");
  }

  process.exit(0);
}

inspectSchedule();
