/**
 * Cronicle Job Setup Script for Todoist Active Tasks
 * Registers/Updates event on http://umbrel.local:3012
 * Schedule: Every 30 minutes from 6:00 AM to 12:00 AM Midnight (hours 6..23, 0; minutes 0, 30)
 */

const axios = require('axios');

const CRONICLE_URL = process.env.CRONICLE_URL || 'http://umbrel.local:3012';
const CRONICLE_API_KEY = process.env.CRONICLE_API_KEY || 'ba768ce3fa7125fa071a5e2d62110bd7';

const ACTIVE_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];
const INTERVAL_MINUTES = [0, 30];

// Self-contained inline Node.js script using native fetch
const inlineScriptContent = `#!/usr/bin/env node

const TODOIST_TOKEN = "1a3f2d0c74b55c9503e88a2b5c6221485fc32c1b";

async function run() {
  const now = new Date();
  console.log("📡 Fetching Todoist tasks from API v1...");

  const res = await fetch("https://api.todoist.com/api/v1/tasks", {
    headers: {
      "Authorization": \`Bearer \${TODOIST_TOKEN}\`
    }
  });

  const data = await res.json();
  const rawTasks = data.results || data || [];

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
      isOverdue
    };
  });

  console.log(\`📊 Todoist Active Tasks (\${formattedTasks.length}):\`, JSON.stringify(formattedTasks));

  // Direct Firestore REST API Update
  const firestoreUrl = "https://firestore.googleapis.com/v1/projects/epaper-api-key/databases/(default)/documents/api_feeds/todoist_metrics";
  
  // Build Firestore map elements
  const taskMapValues = formattedTasks.map(t => ({
    mapValue: {
      fields: {
        id: { stringValue: String(t.id) },
        content: { stringValue: String(t.content) },
        due: { stringValue: String(t.due) },
        priority: { integerValue: t.priority },
        isOverdue: { booleanValue: t.isOverdue }
      }
    }
  }));

  const patchData = {
    fields: {
      apiName: { stringValue: "TODOIST" },
      source: { stringValue: "Todoist Worker" },
      timestamp: { timestampValue: now.toISOString() },
      status: { stringValue: "success" },
      payload: {
        mapValue: {
          fields: {
            totalPending: { integerValue: formattedTasks.length },
            lastUpdated: { stringValue: now.toISOString() },
            tasks: {
              arrayValue: {
                values: taskMapValues
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
    console.log("✅ Successfully updated Firestore document 'api_feeds/todoist_metrics'");
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

async function setupCronicleTodoistJob() {
  const createUrl = `${CRONICLE_URL}/api/app/create_event/v1?api_key=${CRONICLE_API_KEY}`;

  const eventPayload = {
    title: "Todoist Tasks Telemetry Sync",
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
    notes: "Self-contained inline script fetching active Todoist tasks every 30 minutes from 6:00 AM to 12:00 AM Midnight."
  };

  console.log(`📡 Creating/updating Cronicle event 'Todoist Tasks Telemetry Sync' on ${CRONICLE_URL}...`);

  try {
    const response = await axios.post(createUrl, eventPayload);
    const data = response.data;

    if (data.code === 0) {
      console.log(`✅ Cronicle Todoist Event created successfully! Event ID: ${data.id}`);
    } else {
      console.warn(`⚠️ Cronicle response:`, data);
    }
  } catch (error) {
    console.error(`❌ Cronicle setup error:`, error.response ? error.response.data : error.message);
  }
}

setupCronicleTodoistJob();
