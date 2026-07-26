/**
 * Cronicle Worker Script: MedX Tracker & Study Time Fetcher
 * Target: https://medx.srihari.quest/api/tracker & /api/studytime
 * Schedule: Runs every 30 minutes (6 AM to 12 AM) in Cronicle Docker
 * Target Firebase DB: epaper-api-key -> Collection: 'api_feeds' -> Document: 'medx_metrics'
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const axios = require('axios');
const path = require('path');

const MEDX_BASE_URL = process.env.MEDX_BASE_URL || 'https://medx.srihari.quest';
const MEDX_PASSWORD = process.env.MEDX_PASSWORD || 'superstudiopro';
const SERVICE_ACCOUNT_FILE = process.env.FIREBASE_SERVICE_ACCOUNT || '../epaper-api-key-firebase-adminsdk-fbsvc-14ee0d69d4.json';

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    const serviceAccountPath = path.resolve(__dirname, SERVICE_ACCOUNT_FILE);
    const serviceAccount = require(serviceAccountPath);
    initializeApp({ credential: cert(serviceAccount) });
    console.log("⚡ Firebase Admin initialized");
  } catch (err) {
    console.error("❌ Failed to load Firebase Service Account:", err.message);
    process.exit(1);
  }
}

const db = getFirestore();

async function fetchMedXData() {
  const now = new Date();
  console.log("📡 Fetching MedX Tracker & Study Time Telemetry...");

  try {
    // 1. Fetch Tracker Data
    const trackerRes = await axios.get(`${MEDX_BASE_URL}/api/tracker?userId=NpFFvozZSFWnCKdmutkISEGPf8o2`);
    const trackerData = trackerRes.data || {};
    const subjects = trackerData.subjects || {};
    const gts = trackerData.gts || {};

    let totalSubItemsCount = 0;
    let completedSubItemsCount = 0;

    Object.values(subjects).forEach(subObj => {
      Object.values(subObj).forEach(isDone => {
        totalSubItemsCount++;
        if (isDone) completedSubItemsCount++;
      });
    });

    let totalGtsCount = 7;
    let completedGtsCount = 0;
    Object.values(gts).forEach(val => {
      if (val) completedGtsCount++;
    });

    let totalSubjectsCount = 19;
    let completedSubjectsCount = 0;
    Object.values(subjects).forEach(subObj => {
      const vals = Object.values(subObj);
      if (vals.length > 0 && vals.every(v => Boolean(v))) {
        completedSubjectsCount++;
      }
    });

    // Total 121 items (114 subject items + 7 GTs)
    const totalItemsCount = (totalSubItemsCount || 114) + totalGtsCount;
    const completedItemsCount = completedSubItemsCount + completedGtsCount;

    const completionPercentage = totalItemsCount > 0 
      ? ((completedItemsCount / totalItemsCount) * 100).toFixed(1) 
      : "0.0";

    // 2. Fetch Study Time Data
    const studyRes = await axios.get(`${MEDX_BASE_URL}/api/studytime?password=${MEDX_PASSWORD}`);
    const studyState = studyRes.data?.state || {};

    const payload = {
      lastUpdated: now.toISOString(),
      summary: {
        todayStudyHours: Number(studyState.todayStudyHours || 0).toFixed(2),
        todayPyqHours: Number(studyState.todayPyqHours || 0).toFixed(2),
        streakDays: studyState.streak || 0,
        pyqStreakDays: studyState.streakPyq || 0,
        weeklyGrandTotalHours: Number(studyState.weeklyGrandTotalHours || 0).toFixed(2),
        completionPercentage: `${completionPercentage}%`,
        completedSubjects: completedSubjectsCount,
        totalSubjects: totalSubjectsCount,
        completedGts: completedGtsCount,
        totalGts: totalGtsCount,
        completedItems: completedItemsCount,
        totalItems: totalItemsCount,
        hasActiveTimer: Boolean(studyState.activeTimer?.isRunning)
      },
      rawState: {
        study: studyState,
        tracker: trackerData
      }
    };

    console.log("📊 Parsed MedX Telemetry:");
    console.log(`   - Completion Percentage: ${payload.summary.completionPercentage}`);
    console.log(`   - Subjects: ${payload.summary.completedSubjects}/${payload.summary.totalSubjects}`);
    console.log(`   - GTs: ${payload.summary.completedGts}/${payload.summary.totalGts}`);
    console.log(`   - Total Items: ${payload.summary.completedItems}/${payload.summary.totalItems}`);
    console.log(`   - Study Hours: Today=${payload.summary.todayStudyHours}h | Weekly=${payload.summary.weeklyGrandTotalHours}h`);

    // OVERWRITE/UPDATE canonical document 'medx_metrics' in Firestore
    await db.collection('api_feeds').doc('medx_metrics').set({
      apiName: 'MEDX',
      source: 'MedX Platform API',
      timestamp: FieldValue.serverTimestamp(),
      status: 'success',
      payload: payload
    }, { merge: true });

    console.log("✅ Successfully updated canonical Firestore document: 'api_feeds/medx_metrics'");
    process.exit(0);
  } catch (error) {
    console.error("❌ MedX API Error:", error.response ? error.response.status + " " + JSON.stringify(error.response.data) : error.message);
    process.exit(1);
  }
}

fetchMedXData();
