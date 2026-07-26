/**
 * Cronicle Job Setup Script (Self-Contained Inline Worker)
 * Registers/Updates the Cronicle event on http://umbrel.local:3012
 * Contains full inline Node.js execution script so no external files/modules are required on Umbrel
 */

const axios = require('axios');

const CRONICLE_URL = process.env.CRONICLE_URL || 'http://umbrel.local:3012';
const CRONICLE_API_KEY = process.env.CRONICLE_API_KEY || 'ba768ce3fa7125fa071a5e2d62110bd7';

const ACTIVE_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];
const INTERVAL_MINUTES = [0, 30];

// Inline Shell Script using native Node.js 18 fetch
const inlineScriptContent = `#!/usr/bin/env node

const DEVICE_ID = "36ff8e5467b2";
const AUTH_TOKEN = "Bearer 5627234a-129e-46be-b318-240d06871671";

function formatDDMMYYYY(d) {
  return String(d.getDate()).padStart(2, '0') + String(d.getMonth() + 1).padStart(2, '0') + d.getFullYear();
}

function formatMMYYYY(d) {
  return String(d.getMonth() + 1).padStart(2, '0') + d.getFullYear();
}

async function run() {
  const now = new Date();
  const today = formatDDMMYYYY(now);

  const sevenDaysAgo = new Date(); 
  sevenDaysAgo.setDate(now.getDate() - 6);
  const sevenDays = formatDDMMYYYY(sevenDaysAgo);

  const fourWeeksAgo = new Date(); 
  fourWeeksAgo.setDate(now.getDate() - 28);
  const fourWeeks = formatDDMMYYYY(fourWeeksAgo);

  const startMonth = "01" + now.getFullYear();
  const endMonth = formatMMYYYY(now);

  const headers = {
    "Host": "app.miraie.in",
    "Content-Type": "application/json",
    "User-Agent": "MirAIe/1.4.10 (com.panasonic.in.miraie; build:16; iOS 27.0.0) Alamofire/5.11.2",
    "Authorization": AUTH_TOKEN
  };

  console.log("📡 Fetching AC Power consumption from Panasonic MirAIe API...");

  const dailyRes = await fetch(\`https://app.miraie.in/simplifi/v1/powerConsumption/devices/\${DEVICE_ID}?grain=Daily&startDate=\${sevenDays}&endDate=\${today}\`, { headers });
  const dailyData = await dailyRes.json();

  const weeklyRes = await fetch(\`https://app.miraie.in/simplifi/v1/powerConsumption/devices/\${DEVICE_ID}?grain=Weekly&startDate=\${fourWeeks}&endDate=\${today}\`, { headers });
  const weeklyData = await weeklyRes.json();

  const monthlyRes = await fetch(\`https://app.miraie.in/simplifi/v1/powerConsumption/devices/\${DEVICE_ID}?grain=Monthly&startDate=\${startMonth}&endDate=\${endMonth}\`, { headers });
  const monthlyData = await monthlyRes.json();

  const todayRecord = Array.isArray(dailyData) && dailyData.length > 0 ? dailyData[dailyData.length - 1] : dailyData;
  const thisWeekRecord = Array.isArray(weeklyData) && weeklyData.length > 0 ? weeklyData[weeklyData.length - 1] : weeklyData;
  const thisMonthRecord = Array.isArray(monthlyData) && monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : monthlyData;

  const todayKwh = Number(todayRecord ? (todayRecord.power || 0) : 0).toFixed(2);
  const thisWeekKwh = Number(thisWeekRecord ? (thisWeekRecord.power || 0) : 0).toFixed(2);
  const thisMonthKwh = Number(thisMonthRecord ? (thisMonthRecord.power || 0) : 0).toFixed(2);

  console.log(\`📊 AC Power Summary -> Today: \${todayKwh} kWh | Week: \${thisWeekKwh} kWh | Month: \${thisMonthKwh} kWh\`);

  // Direct Firestore REST API Update
  const firestoreUrl = "https://firestore.googleapis.com/v1/projects/epaper-api-key/databases/(default)/documents/api_feeds/ac_power_metrics";
  
  const patchData = {
    fields: {
      apiName: { stringValue: "AC_POWER" },
      source: { stringValue: "MirAIe Cronicle Worker" },
      timestamp: { timestampValue: now.toISOString() },
      status: { stringValue: "success" },
      payload: {
        mapValue: {
          fields: {
            deviceId: { stringValue: DEVICE_ID },
            lastUpdated: { stringValue: now.toISOString() },
            summary: {
              mapValue: {
                fields: {
                  todayKwh: { doubleValue: parseFloat(todayKwh) },
                  thisWeekKwh: { doubleValue: parseFloat(thisWeekKwh) },
                  thisMonthKwh: { doubleValue: parseFloat(thisMonthKwh) },
                  unit: { stringValue: "kWh" }
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
    console.log("✅ Successfully updated Firestore document 'api_feeds/ac_power_metrics'");
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

async function updateCronicleJob() {
  const updateUrl = `${CRONICLE_URL}/api/app/update_event/v1?api_key=${CRONICLE_API_KEY}`;

  const eventPayload = {
    id: "ems1esk7602",
    title: "AC Power Telemetry Sync",
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
    notes: "Self-contained inline script fetching MirAIe AC Power consumption every 20 minutes from 6:00 AM to 12:00 AM Midnight."
  };

  console.log(`📡 Updating Cronicle event 'ems1esk7602' with self-contained inline script...`);

  try {
    const response = await axios.post(updateUrl, eventPayload);
    const data = response.data;

    if (data.code === 0) {
      console.log(`✅ Cronicle Event successfully updated with self-contained script!`);
    } else {
      console.warn(`⚠️ Cronicle response:`, data);
    }
  } catch (error) {
    console.error(`❌ Cronicle API update error:`, error.response ? error.response.data : error.message);
  }
}

updateCronicleJob();
