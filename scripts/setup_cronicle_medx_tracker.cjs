/**
 * Cronicle Setup Script: MedX Tracker Sync
 * Registers event titled "MedX Tracker Sync" on http://umbrel.local:3012
 * Schedule: Every 30 minutes, 24/7
 */

const axios = require('axios');

const CRONICLE_URL = process.env.CRONICLE_URL || 'http://umbrel.local:3012';
const CRONICLE_API_KEY = process.env.CRONICLE_API_KEY || 'ba768ce3fa7125fa071a5e2d62110bd7';

const ACTIVE_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];
// Minutes 5, 35 of 6 AM to 12 AM
const INTERVAL_MINUTES = [5, 35];


// Self-contained inline Node.js script
const inlineScriptContent = `#!/usr/bin/env node

const MEDX_BASE_URL = "https://medx.srihari.quest";

async function run() {
  const now = new Date();
  console.log("📡 Fetching MedX Tracker Progress Telemetry...");

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

  console.log(\`📊 MedX Tracker Summary -> Pct: \${completionPercentage} | Subs: \${completedSubjectsCount}/\${totalSubjectsCount} | GTs: \${completedGtsCount}/\${totalGtsCount} | Items: \${completedItemsCount}/\${totalItemsCount}\`);

  // Direct Firestore REST API Update to 'api_feeds/medx_tracker'
  const firestoreUrl = "https://firestore.googleapis.com/v1/projects/epaper-api-key/databases/(default)/documents/api_feeds/medx_tracker";
  
  const patchData = {
    fields: {
      apiName: { stringValue: "MEDX_TRACKER" },
      source: { stringValue: "MedX Tracker Worker" },
      timestamp: { timestampValue: now.toISOString() },
      status: { stringValue: "success" },
      payload: {
        mapValue: {
          fields: {
            lastUpdated: { stringValue: now.toISOString() },
            summary: {
              mapValue: {
                fields: {
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
    console.log("✅ Successfully updated Firestore document 'api_feeds/medx_tracker'");
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

async function setupTrackerJob() {
  const updateUrl = `${CRONICLE_URL}/api/app/update_event/v1?api_key=${CRONICLE_API_KEY}`;
  const createUrl = `${CRONICLE_URL}/api/app/create_event/v1?api_key=${CRONICLE_API_KEY}`;

  const eventPayload = {
    id: "ems1irisu0l",
    title: "MedX Tracker Sync",
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
    notes: "Self-contained inline script fetching MedX Tracker progress (0/19 subjects, 0/7 GTs, 0/121 items) every 30 minutes 24/7."
  };

  console.log(`📡 Updating Cronicle event 'MedX Tracker Sync' on ${CRONICLE_URL}...`);

  try {
    const response = await axios.post(updateUrl, eventPayload);
    if (response.data.code === 0) {
      console.log(`✅ Cronicle Event updated to 'MedX Tracker Sync'!`);
    } else {
      const createRes = await axios.post(createUrl, eventPayload);
      console.log(`✅ Cronicle Event response:`, createRes.data);
    }
  } catch (error) {
    console.error(`❌ Cronicle setup error:`, error.response ? error.response.data : error.message);
  }
}

setupTrackerJob();
