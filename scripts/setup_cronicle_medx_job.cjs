/**
 * Cronicle Job Setup Script for MedX Telemetry
 * Registers/Updates event on http://umbrel.local:3012
 * Schedule: Every 30 minutes from 6:00 AM to 12:00 AM Midnight (hours 6..23, 0; minutes 0, 30)
 */

const axios = require('axios');

const CRONICLE_URL = process.env.CRONICLE_URL || 'http://umbrel.local:3012';
const CRONICLE_API_KEY = process.env.CRONICLE_API_KEY || 'ba768ce3fa7125fa071a5e2d62110bd7';

// Run 24/7 across all 24 hours (0..23)
const ACTIVE_HOURS = Array.from({ length: 24 }, (_, i) => i);
const INTERVAL_MINUTES = [0, 30];

// Self-contained inline Node.js script using native fetch
const inlineScriptContent = `#!/usr/bin/env node

const MEDX_BASE_URL = "https://medx.srihari.quest";
const MEDX_PASSWORD = "superstudiopro";

async function run() {
  const now = new Date();
  console.log("📡 Fetching MedX Tracker & Study Time Telemetry...");

  // 1. Fetch Tracker
  const trackerRes = await fetch(\`\${MEDX_BASE_URL}/api/tracker?userId=NpFFvozZSFWnCKdmutkISEGPf8o2\`);
  const trackerData = await trackerRes.json();
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

  const totalItemsCount = (totalSubItemsCount || 114) + totalGtsCount;
  const completedItemsCount = completedSubItemsCount + completedGtsCount;

  const completionPercentage = totalItemsCount > 0 
    ? ((completedItemsCount / totalItemsCount) * 100).toFixed(1) + "%"
    : "0.0%";

  // 2. Fetch Study Time
  const studyRes = await fetch(\`\${MEDX_BASE_URL}/api/studytime?password=\${MEDX_PASSWORD}\`);
  const studyData = await studyRes.json();
  const studyState = studyData.state || {};

  const todayStudyHours = Number(studyState.todayStudyHours || 0).toFixed(2);
  const todayPyqHours = Number(studyState.todayPyqHours || 0).toFixed(2);
  const streakDays = studyState.streak || 0;
  const pyqStreakDays = studyState.streakPyq || 0;
  const weeklyGrandTotalHours = Number(studyState.weeklyGrandTotalHours || 0).toFixed(2);

  console.log(\`📊 MedX Summary -> Pct: \${completionPercentage} | Subs: \${completedSubjectsCount}/\${totalSubjectsCount} | GTs: \${completedGtsCount}/\${totalGtsCount} | Items: \${completedItemsCount}/\${totalItemsCount}\`);

  // Direct Firestore REST API Update
  const firestoreUrl = "https://firestore.googleapis.com/v1/projects/epaper-api-key/databases/(default)/documents/api_feeds/medx_metrics";
  
  const patchData = {
    fields: {
      apiName: { stringValue: "MEDX" },
      source: { stringValue: "MedX Worker" },
      timestamp: { timestampValue: now.toISOString() },
      status: { stringValue: "success" },
      payload: {
        mapValue: {
          fields: {
            lastUpdated: { stringValue: now.toISOString() },
            summary: {
              mapValue: {
                fields: {
                  todayStudyHours: { stringValue: todayStudyHours },
                  todayPyqHours: { stringValue: todayPyqHours },
                  streakDays: { integerValue: streakDays },
                  pyqStreakDays: { integerValue: pyqStreakDays },
                  weeklyGrandTotalHours: { stringValue: weeklyGrandTotalHours },
                  completionPercentage: { stringValue: completionPercentage },
                  completedSubjects: { integerValue: completedSubjectsCount },
                  totalSubjects: { integerValue: totalSubjectsCount },
                  completedGts: { integerValue: completedGtsCount },
                  totalGts: { integerValue: totalGtsCount },
                  completedItems: { integerValue: completedItemsCount },
                  totalItems: { integerValue: totalItemsCount }
                }
              }
            }
          }
        }
      }
    }
  };

  const fsRes = await fetch(firestoreUrl, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patchData)
  });

  if (fsRes.ok) {
    console.log("✅ Successfully updated Firestore document 'api_feeds/medx_metrics'");
  } else {
    const errText = await fsRes.text();
    console.error("❌ Firestore API Error:", fsRes.status, errText);
    process.exit(1);
  }
}

run().catch(err => {
  console.error("❌ Execution Error:", err);
  process.exit(1);
});
`;

async function setupCronicleMedXJob() {
  const updateUrl = `${CRONICLE_URL}/api/app/update_event/v1?api_key=${CRONICLE_API_KEY}`;
  const createUrl = `${CRONICLE_URL}/api/app/create_event/v1?api_key=${CRONICLE_API_KEY}`;

  const eventPayload = {
    id: "ems1irisu0l",
    title: "MedX Telemetry Sync",
    enabled: 1,
    category: "general",
    target: "allgrp",
    algo: "random",
    plugin: "shellplug",
    timing: {
      hours: ACTIVE_HOURS,
      minutes: INTERVAL_MINUTES
    },
    params: {
      script: inlineScriptContent
    },
    notes: "Self-contained inline script fetching MedX Study Time and Tracker metrics (0/19 subjects, 0/7 GTs, 0/121 items) every 30 minutes from 6:00 AM to 12:00 AM Midnight."
  };

  console.log(`📡 Updating Cronicle event 'ems1irisu0l' on ${CRONICLE_URL}...`);

  try {
    const response = await axios.post(updateUrl, eventPayload);
    const data = response.data;

    if (data.code === 0) {
      console.log(`✅ Cronicle MedX Event updated successfully!`);
    } else {
      const createRes = await axios.post(createUrl, eventPayload);
      console.log(`✅ Cronicle MedX Event response:`, createRes.data);
    }
  } catch (error) {
    console.error(`❌ Cronicle setup error:`, error.response ? error.response.data : error.message);
  }
}

setupCronicleMedXJob();
