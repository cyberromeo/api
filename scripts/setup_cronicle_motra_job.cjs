/**
 * Cronicle Job Setup Script for Motra Muscle Recovery (All 18 Muscles)
 * Registers/Updates event on http://umbrel.local:3012
 * Schedule: Every 30 minutes 24/7
 */

const axios = require('axios');

const CRONICLE_URL = process.env.CRONICLE_URL || 'http://umbrel.local:3012';
const CRONICLE_API_KEY = process.env.CRONICLE_API_KEY || 'ba768ce3fa7125fa071a5e2d62110bd7';

const ACTIVE_HOURS = Array.from({ length: 24 }, (_, i) => i);
const INTERVAL_MINUTES = [0, 30];

// Self-contained inline Node.js script using native fetch
const inlineScriptContent = `#!/usr/bin/env node

const MOTRA_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2ZWUwMzFlODZhM2YwZmNkOWI2ZDcwMDJiMDJiMDg6ZDJmNTVkZTQiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiU1JJSEFSSSBQUkFCQUtBUkFOIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0pnMWR3LV9SbGZLbG4zLUhTM21UbUJDTHFiVU11OVRuRW8wNENZcWtCc3pfQkQydEk0PXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3RyYWluLTE2NWQzIiwiYXVkIjoidHJhaW4tMTY1ZDMiLCJhdXRoX3RpbWUiOjE3NzgyMjk4MzAsInVzZXJfaWQiOiI3dTRHTFRrV2ZJTXBqSjhHd2pUYXlyNTJLa2IyIiwic3ViIjoiN3U0R0xUa1dmSU1wako4R3dqVGF5cjUyS2tiMiIsImlhdCI6MTc4NTA2MDI3MiwiZXhwIjoxNzg1MDYzODcyLCJlbWFpbCI6InBzcmloYXJpMjM4QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImFwcGxlLmNvbSI6WyIwMDA0ODguNzcwNDU1NTAyYjk4NGY1OWEyYjhiOWUwYzI0MDdmMTMuMDAwNiJdLCJnb29nbGUuY29tIjpbIjEwNzA0MDkyNzY4MjA3NTU0NDY4OSJdLCJlbWFpbCI6WyJwc3JpaGFyaTIzOEBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.AcN0NHMkfG1IUD4mgXlMO-ASgUzHjgK4Iebg-qipAM6P_elwVN37jpNUJV0zihwjY41GaNg7LXuYy5BOwWEAxRSbSY2URuEPxsVZK4FvmzRQKyLR46JhgZRdGNZPKrp_93U_zNudD49oL_ObLDwnnxG7vl44dCmHhHtjya2pSRFjka2gbgLe77mNxvOZOHoKcfjdKpC7JmXxIxr48aq-nQXMRmHYzQMNrl1orTFVzo9VtNi9sKIRwuxoKyE1xm0RoaVVnBrwHKHPZw5d7lXdQhlzVTl3Yad845leOuWP2I00er5gtoZZRVGFTNVfNRPH6fnI_ReZ963D8wQ1fSDa3w";

async function run() {
  const now = new Date();
  console.log("📡 Fetching Motra Muscle Recovery Telemetry...");

  const res = await fetch("https://backend.motra.com/user/muscle-recovery", {
    headers: {
      "Host": "backend.motra.com",
      "Content-Type": "application/json",
      "Accept": "*/*",
      "User-Agent": "Motra/1 CFNetwork/3892.100.1 Darwin/27.0.0",
      "Authorization": \`Bearer \${MOTRA_TOKEN}\`,
      "Accept-Language": "en-IN,en;q=0.9"
    }
  });

  const responseData = await res.json();
  const data = responseData.data || {};
  const muscleStats = data.musclesRecoveryStats || [];

  let sumPct = 0;
  const musclesMapFields = {};

  muscleStats.forEach(m => {
    sumPct += (m.recovery || 0);
    musclesMapFields[m.muscle] = {
      mapValue: {
        fields: {
          recovery: { integerValue: m.recovery ?? 100 },
          daysToRecovery: { integerValue: m.daysToRecovery ?? 0 },
          daysSinceLastUsed: m.daysSinceLastUsed ? { integerValue: m.daysSinceLastUsed } : { nullValue: null }
        }
      }
    };
  });

  const avgRecoveryPct = muscleStats.length > 0 ? (sumPct / muscleStats.length).toFixed(0) : "100";

  console.log(\`📊 Motra Recovery Summary -> Overall: \${avgRecoveryPct}% | Recovered: \${data.recoveredMuscles}/18 | Days Since Workout: \${data.daysSinceLastWorkout}d\`);
  console.log("💪 All 18 Muscle Recovery Telemetry:");
  muscleStats.forEach((m, idx) => {
    console.log(\`   [\${idx + 1}] \${m.muscle}: \${m.recovery}% (Days to full recovery: \${m.daysToRecovery})\`);
  });

  // Direct Firestore REST API Update
  const firestoreUrl = "https://firestore.googleapis.com/v1/projects/epaper-api-key/databases/(default)/documents/api_feeds/motra_metrics";
  
  const patchData = {
    fields: {
      apiName: { stringValue: "MOTRA" },
      source: { stringValue: "Motra Worker" },
      timestamp: { timestampValue: now.toISOString() },
      status: { stringValue: "success" },
      payload: {
        mapValue: {
          fields: {
            lastUpdated: { stringValue: now.toISOString() },
            summary: {
              mapValue: {
                fields: {
                  overallRecoveryPct: { stringValue: \`\${avgRecoveryPct}%\` },
                  recoveredMuscles: { stringValue: \`\${data.recoveredMuscles || 18}/18\` },
                  recoveringMuscles: { integerValue: data.recoveringMuscles || 0 },
                  daysSinceLastWorkout: { integerValue: data.daysSinceLastWorkout || 0 }
                }
              }
            },
            musclesMap: {
              mapValue: {
                fields: musclesMapFields
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
    console.log("✅ Successfully updated Firestore document 'api_feeds/motra_metrics'");
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

async function setupCronicleMotraJob() {
  const updateUrl = `${CRONICLE_URL}/api/app/update_event/v1?api_key=${CRONICLE_API_KEY}`;
  const createUrl = `${CRONICLE_URL}/api/app/create_event/v1?api_key=${CRONICLE_API_KEY}`;

  const eventPayload = {
    id: "ems1n964g1f",
    title: "Motra Muscle Recovery Sync",
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
    notes: "Self-contained inline script fetching Motra Muscle Recovery telemetry for all 18 muscles every 30 minutes 24/7."
  };

  console.log(`📡 Updating Cronicle event 'ems1n964g1f' on ${CRONICLE_URL}...`);

  try {
    const response = await axios.post(updateUrl, eventPayload);
    if (response.data.code === 0) {
      console.log(`✅ Cronicle Motra Event updated successfully!`);
    } else {
      const createRes = await axios.post(createUrl, eventPayload);
      console.log(`✅ Cronicle Motra Event response:`, createRes.data);
    }
  } catch (error) {
    console.error(`❌ Cronicle setup error:`, error.response ? error.response.data : error.message);
  }
}

setupCronicleMotraJob();
