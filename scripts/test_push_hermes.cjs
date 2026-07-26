/**
 * Seed & Test Script for Hermes Agent Class Schedule & Exams DB
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
  console.log("⚡ Seeding initial Class Schedule & Exams in Firestore...");

  // 1. Seed Class Schedule
  const classPayload = {
    date: new Date().toISOString().split('T')[0],
    total_classes: 3,
    classes: [
      { id: "cls_1", subject: "Pathology Lecture", time: "09:00 AM - 10:30 AM", room: "Hall A", topic: "Cell Injury & Apoptosis", instructor: "Dr. Sharma" },
      { id: "cls_2", subject: "Pharmacology Practical", time: "11:00 AM - 01:00 PM", room: "Lab 2", topic: "Autonomic Nervous System", instructor: "Dr. Verma" },
      { id: "cls_3", subject: "Microbiology Discussion", time: "02:30 PM - 04:00 PM", room: "Seminar Room", topic: "Bacterial Genetics", instructor: "Dr. Gupta" }
    ],
    notes: "Pushed by Hermes Agent",
    source: "Hermes Agent",
    updated_at: new Date().toISOString()
  };

  await db.collection('api_feeds').doc('class_schedule').set({
    apiName: 'CLASS_SCHEDULE',
    source: 'Hermes Agent',
    timestamp: FieldValue.serverTimestamp(),
    status: 'success',
    payload: classPayload
  }, { merge: true });

  console.log("✅ Successfully created/updated 'api_feeds/class_schedule' document");

  // 2. Seed Exams Schedule
  const examsPayload = {
    total_upcoming: 2,
    exams: [
      { id: "ex_1", name: "FMGE July 2026 Grand Test", subject: "All Subjects", date: "2026-08-15", time: "09:00 AM", days_remaining: 20, venue: "Exam Hall 1", total_marks: 300 },
      { id: "ex_2", name: "Pathology Midterm Exam", subject: "Pathology", date: "2026-08-01", time: "10:00 AM", days_remaining: 6, venue: "Hall B", total_marks: 100 }
    ],
    source: "Hermes Agent",
    updated_at: new Date().toISOString()
  };

  await db.collection('api_feeds').doc('exams_schedule').set({
    apiName: 'EXAMS_SCHEDULE',
    source: 'Hermes Agent',
    timestamp: FieldValue.serverTimestamp(),
    status: 'success',
    payload: examsPayload
  }, { merge: true });

  console.log("✅ Successfully created/updated 'api_feeds/exams_schedule' document");
  process.exit(0);
}

seedHermesData();
