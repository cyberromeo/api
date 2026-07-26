/**
 * Clear mock sample class and exam schedules from Firestore database
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const path = require('path');

const SERVICE_ACCOUNT_FILE = process.env.FIREBASE_SERVICE_ACCOUNT || '../epaper-api-key-firebase-adminsdk-fbsvc-14ee0d69d4.json';

if (!getApps().length) {
  const serviceAccountPath = path.resolve(__dirname, SERVICE_ACCOUNT_FILE);
  const serviceAccount = require(serviceAccountPath);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function clearSampleData() {
  console.log("🧹 Clearing mock sample data from Firestore...");

  // 1. Clear Class Schedule to empty array
  await db.collection('api_feeds').doc('class_schedule').set({
    apiName: 'CLASS_SCHEDULE',
    source: 'Hermes Agent',
    timestamp: FieldValue.serverTimestamp(),
    status: 'success',
    payload: {
      total_classes: 0,
      classes: [],
      updated_at: new Date().toISOString()
    }
  }, { merge: true });

  console.log("✅ Cleared 'class_schedule' -> classes: []");

  // 2. Clear Exams Schedule to empty array
  await db.collection('api_feeds').doc('exams_schedule').set({
    apiName: 'EXAMS_SCHEDULE',
    source: 'Hermes Agent',
    timestamp: FieldValue.serverTimestamp(),
    status: 'success',
    payload: {
      total_upcoming: 0,
      exams: [],
      updated_at: new Date().toISOString()
    }
  }, { merge: true });

  console.log("✅ Cleared 'exams_schedule' -> exams: []");
  process.exit(0);
}

clearSampleData();
