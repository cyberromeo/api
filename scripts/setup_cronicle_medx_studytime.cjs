/**
 * Cronicle Setup Script: MedX Study Time Sync
 * Registers event titled "MedX Study Time Sync" on http://umbrel.local:3012
 * Schedule: Every 30 minutes, 24/7
 */

const axios = require('axios');

const CRONICLE_URL = process.env.CRONICLE_URL || 'http://umbrel.local:3012';
const CRONICLE_API_KEY = process.env.CRONICLE_API_KEY || 'ba768ce3fa7125fa071a5e2d62110bd7';

const ACTIVE_HOURS = Array.from({ length: 24 }, (_, i) => i);
const INTERVAL_MINUTES = [0, 30];

// Self-contained inline Node.js script
const inlineScriptContent = `#!/usr/bin/env node

const MEDX_BASE_URL = "https://medx.srihari.quest";
const MEDX_PASSWORD = "superstudiopro";

async function run() {
  const now = new Date();
  console.log("📡 Fetching MedX Study Time Telemetry...");

  const studyRes = await fetch(\`\${MEDX_BASE_URL}/api/studytime?password=\${MEDX_PASSWORD}\`);
  const studyData = await studyRes.json();
  const state = studyData.state || {};

  const todayStudyHours = Number(state.todayStudyHours || 0).toFixed(2);
  const todayPyqHours = Number(state.todayPyqHours || 0).toFixed(2);
  const streakDays = state.streak || 0;
  const pyqStreakDays = state.streakPyq || 0;
  const weeklyGrandTotalHours = Number(state.weeklyGrandTotalHours || 0).toFixed(2);

  console.log(\`📊 MedX Study Time Summary -> Today: \${todayStudyHours}h | PYQ: \${todayPyqHours}h | Streak: \${streakDays}d | Weekly: \${weeklyGrandTotalHours}h\`);

  // Direct Firestore REST API Update to 'api_feeds/medx_studytime'
  const firestoreUrl = "https://firestore.googleapis.com/v1/projects/epaper-api-key/databases/(default)/documents/api_feeds/medx_studytime";
  
  const patchData = {
    fields: {
      apiName: { stringValue: "MEDX_STUDYTIME" },
      source: { stringValue: "MedX Study Time Worker" },
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
                  hasActiveTimer: { booleanValue: Boolean(state.activeTimer?.isRunning) }
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
    console.log("✅ Successfully updated Firestore document 'api_feeds/medx_studytime'");
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

async function setupStudyTimeJob() {
  const createUrl = `${CRONICLE_URL}/api/app/create_event/v1?api_key=${CRONICLE_API_KEY}`;

  const eventPayload = {
    title: "MedX Study Time Sync",
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
    notes: "Self-contained inline script fetching MedX Study Time (today hours, PYQ, streak, weekly total) every 30 minutes 24/7."
  };

  console.log(`📡 Registering Cronicle event 'MedX Study Time Sync' on ${CRONICLE_URL}...`);

  try {
    const response = await axios.post(createUrl, eventPayload);
    console.log(`✅ Cronicle Response:`, response.data);
  } catch (error) {
    console.error(`❌ Cronicle setup error:`, error.response ? error.response.data : error.message);
  }
}

setupStudyTimeJob();
