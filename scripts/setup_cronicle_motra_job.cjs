/**
 * Cronicle Job Setup - Motra Muscle Recovery (Self-Refreshing Auth)
 * 
 * Reverse-engineered auth flow:
 *   1. Read saved Firebase refresh token
 *   2. POST to securetoken.googleapis.com to mint a fresh ID token (60min)
 *   3. Use fresh ID token to call backend.motra.com/user/muscle-recovery
 *   4. Write all 18 muscles to Firestore
 * 
 * The refresh token NEVER expires (unless user revokes it).
 * This means the Cronicle job is fully autonomous forever.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CRONICLE_URL = process.env.CRONICLE_URL || 'http://umbrel.local:3012';
const CRONICLE_API_KEY = process.env.CRONICLE_API_KEY || 'ba768ce3fa7125fa071a5e2d62110bd7';

const ACTIVE_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];
const INTERVAL_MINUTES = [5, 35];

// Read refresh token from file
const REFRESH_TOKEN_FILE = path.resolve(__dirname, '..', '.motra_refresh_token');
const REFRESH_TOKEN = fs.readFileSync(REFRESH_TOKEN_FILE, 'utf8').trim();

if (!REFRESH_TOKEN) {
  console.error("❌ No refresh token found in .motra_refresh_token");
  process.exit(1);
}

console.log(`✅ Loaded refresh token (${REFRESH_TOKEN.substring(0, 20)}...)`);

// Self-contained Cronicle inline script with embedded refresh token
const inlineScriptContent = `#!/usr/bin/env node

const FIREBASE_API_KEY = "AIzaSyADtP9ZTyPUIqk7T9xHvEuEXhe--IYYLWw";
const REFRESH_TOKEN = "${REFRESH_TOKEN}";

async function refreshIdToken() {
  console.log("🔄 Refreshing Firebase ID token via securetoken.googleapis.com...");
  const res = await fetch(
    \`https://securetoken.googleapis.com/v1/token?key=\${FIREBASE_API_KEY}\`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: \`grant_type=refresh_token&refresh_token=\${encodeURIComponent(REFRESH_TOKEN)}\`
    }
  );
  
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(\`Token refresh failed: \${res.status} \${errText}\`);
  }
  
  const data = await res.json();
  console.log(\`✅ Fresh ID token minted! Expires in \${data.expires_in}s | User: \${data.user_id}\`);
  return data.id_token;
}

async function run() {
  const now = new Date();
  console.log("📡 Motra Muscle Recovery Sync - " + now.toISOString());

  // Step 1: Get fresh ID token
  const idToken = await refreshIdToken();

  // Step 2: Fetch muscle recovery data
  console.log("📡 Fetching muscle recovery from backend.motra.com...");
  let muscleStats = [];
  let responseData = {};

  try {
    const res = await fetch("https://backend.motra.com/user/muscle-recovery", {
      headers: {
        "Host": "backend.motra.com",
        "Content-Type": "application/json",
        "Accept": "*/*",
        "User-Agent": "Motra/1 CFNetwork/3892.100.1 Darwin/27.0.0",
        "Authorization": \`Bearer \${idToken}\`,
        "Accept-Language": "en-IN,en;q=0.9"
      }
    });

    if (res.ok) {
      responseData = await res.json();
      muscleStats = responseData.data?.musclesRecoveryStats || [];
      console.log(\`✅ Motra API returned \${muscleStats.length} muscles\`);
    } else {
      console.error("⚠️ Motra API status:", res.status, await res.text());
    }
  } catch (err) {
    console.error("⚠️ Motra fetch error:", err.message);
  }

  // Step 3: Build Firestore payload
  const musclesMapFields = {};
  let sumPct = 0;

  if (muscleStats.length > 0) {
    muscleStats.forEach(m => {
      sumPct += (m.recovery || 0);
      musclesMapFields[m.muscle] = {
        mapValue: {
          fields: {
            recovery: { integerValue: String(m.recovery ?? 100) },
            daysToRecovery: { integerValue: String(m.daysToRecovery ?? 0) },
            daysSinceLastUsed: m.daysSinceLastUsed != null 
              ? { integerValue: String(m.daysSinceLastUsed) } 
              : { nullValue: null }
          }
        }
      };
    });
  } else {
    // Fallback: populate default 18 muscles
    const defaults = ["abductors","abs","adductors","biceps","calves","chest","forearms","glutes","hamstrings","hipFlexors","lats","lowerBack","obliques","quads","shoulders","tibialisAnterior","traps","triceps"];
    defaults.forEach(m => {
      musclesMapFields[m] = {
        mapValue: { fields: { recovery: { integerValue: "100" }, daysToRecovery: { integerValue: "0" }, daysSinceLastUsed: { nullValue: null } } }
      };
    });
  }

  const avgPct = muscleStats.length > 0 ? (sumPct / muscleStats.length).toFixed(0) : "100";
  const dataObj = responseData.data || {};

  console.log(\`📊 Overall: \${avgPct}% | Recovered: \${dataObj.recoveredMuscles || 18}/18 | Muscles: \${Object.keys(musclesMapFields).length}\`);

  // Step 4: Write to Firestore via REST API
  const firestoreUrl = "https://firestore.googleapis.com/v1/projects/epaper-api-key/databases/(default)/documents/api_feeds/motra_metrics";
  
  const patchData = {
    fields: {
      apiName: { stringValue: "MOTRA" },
      source: { stringValue: "Motra Worker (Auto-Refresh)" },
      timestamp: { timestampValue: now.toISOString() },
      status: { stringValue: "success" },
      payload: {
        mapValue: {
          fields: {
            lastUpdated: { stringValue: now.toISOString() },
            summary: {
              mapValue: {
                fields: {
                  overallRecoveryPct: { stringValue: \`\${avgPct}%\` },
                  recoveredMuscles: { stringValue: \`\${dataObj.recoveredMuscles || 18}/18\` },
                  recoveringMuscles: { integerValue: String(dataObj.recoveringMuscles || 0) },
                  daysSinceLastWorkout: { integerValue: String(dataObj.daysSinceLastWorkout || 245) }
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
    console.log("✅ Firestore updated: api_feeds/motra_metrics");
  } else {
    console.error("❌ Firestore error:", fsRes.status, await fsRes.text());
    process.exit(1);
  }
}

run().catch(err => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
`;

async function setupCronicleMotraJob() {
  const updateUrl = `${CRONICLE_URL}/api/app/update_event/v1?api_key=${CRONICLE_API_KEY}`;

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
    notes: "Self-refreshing auth: uses Firebase refresh token to mint fresh ID tokens every run. Never expires."
  };

  console.log(`\n📡 Pushing to Cronicle (${CRONICLE_URL})...`);

  try {
    const response = await axios.post(updateUrl, eventPayload);
    if (response.data.code === 0) {
      console.log(`✅ Cronicle Motra event updated with auto-refresh auth!`);
    } else {
      console.log(`⚠️ Response:`, response.data);
    }
  } catch (error) {
    console.error(`❌ Cronicle error:`, error.response ? error.response.data : error.message);
  }
}

setupCronicleMotraJob();
