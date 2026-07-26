/**
 * Seed & Test Script for Hermes Agent Class Schedule & Exams DB (Simplified: subject & date only)
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

async function seedHermesData() {
  console.log("⚡ Seeding simplified Class Schedule & Exams in Firestore...");

  // 1. Seed Class Schedule
  const classPayload = {
    total_classes: 2,
    classes: [
      { subject: "Pathology Lecture", date: "2026-07-26 09:00 AM" },
      { subject: "Pharmacology Practical", date: "2026-07-26 11:00 AM" }
    ],
    updated_at: new Date().toISOString()
  };

  await db.collection('api_feeds').doc('class_schedule').set({
    apiName: 'CLASS_SCHEDULE',
    source: 'Hermes Agent',
    timestamp: FieldValue.serverTimestamp(),
    status: 'success',
    payload: classPayload
  }, { merge: true });

  console.log("✅ Updated 'api_feeds/class_schedule' document");

  // 2. Seed Exams Schedule
  const examsPayload = {
    total_upcoming: 2,
    exams: [
      { subject: "FMGE July Grand Test", date: "2026-08-15" },
      { subject: "Pathology Midterm Exam", date: "2026-08-01" }
    ],
    updated_at: new Date().toISOString()
  };

  await db.collection('api_feeds').doc('exams_schedule').set({
    apiName: 'EXAMS_SCHEDULE',
    source: 'Hermes Agent',
    timestamp: FieldValue.serverTimestamp(),
    status: 'success',
    payload: examsPayload
  }, { merge: true });

  console.log("✅ Updated 'api_feeds/exams_schedule' document");
  process.exit(0);
}

seedHermesData();
