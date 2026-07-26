/**
 * Cronicle Worker Script: Todoist Active Tasks Fetcher
 * Schedule: Runs every 30 minutes (6 AM to 12 AM) in Cronicle Docker
 * Target Firebase DB: epaper-api-key
 * Collection: 'api_feeds' -> Fixed Document: 'todoist_metrics'
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const axios = require('axios');
const path = require('path');

const TODOIST_TOKEN = process.env.TODOIST_TOKEN || '1a3f2d0c74b55c9503e88a2b5c6221485fc32c1b';
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

async function fetchTodoistTasks() {
  const now = new Date();
  console.log("📡 Fetching active tasks from Todoist API v1...");

  try {
    const response = await axios.get("https://api.todoist.com/api/v1/tasks", {
      headers: {
        "Authorization": `Bearer ${TODOIST_TOKEN}`
      }
    });

    const rawTasks = response.data.results || response.data || [];
    console.log(`📋 Total Active Tasks Fetched: ${rawTasks.length}`);

    // Map tasks into clean structure
    const formattedTasks = rawTasks.map(t => {
      let isOverdue = false;
      let dueDateStr = "No due date";

      if (t.due) {
        dueDateStr = t.due.string || t.due.date;
        const dueObj = new Date(t.due.date);
        if (!isNaN(dueObj.getTime()) && dueObj < now) {
          isOverdue = true;
        }
      }

      return {
        id: t.id,
        content: t.content,
        due: dueDateStr,
        priority: t.priority || 1,
        labels: t.labels || [],
        isOverdue
      };
    });

    const payload = {
      totalPending: formattedTasks.length,
      lastUpdated: now.toISOString(),
      tasks: formattedTasks
    };

    console.log("📊 Processed Todoist Tasks:");
    formattedTasks.forEach((t, i) => {
      console.log(`   [${i + 1}] ${t.content} (${t.due}) ${t.isOverdue ? '⚠️ OVERDUE' : ''}`);
    });

    // OVERWRITE/UPDATE canonical document 'todoist_metrics' in Firestore
    await db.collection('api_feeds').doc('todoist_metrics').set({
      apiName: 'TODOIST',
      source: 'Todoist API v1',
      timestamp: FieldValue.serverTimestamp(),
      status: 'success',
      payload: payload
    }, { merge: true });

    console.log("✅ Successfully updated canonical Firestore document: 'api_feeds/todoist_metrics'");
    process.exit(0);
  } catch (error) {
    console.error("❌ Todoist API Error:", error.response ? error.response.status + " " + JSON.stringify(error.response.data) : error.message);
    process.exit(1);
  }
}

fetchTodoistTasks();
