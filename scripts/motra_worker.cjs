/**
 * Cronicle Worker Script: Motra Muscle Recovery Fetcher
 * Target: https://backend.motra.com/user/muscle-recovery
 * Schedule: Runs every 30 minutes in Cronicle Docker
 * Target Firebase DB: epaper-api-key -> Collection: 'api_feeds' -> Document: 'motra_metrics'
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const axios = require('axios');
const path = require('path');

const MOTRA_TOKEN = process.env.MOTRA_TOKEN || "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2ZWUwMzFlODZhM2YwZmNkOWI2ZDcwMDJiMDJiMDg2ZDJmNTVkZTQiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiU1JJSEFSSSBQUkFCQUtBUkFOIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0pnMWR3LV9SbGZLbG4zLUhTM21UbUJDTHFiVU11OVRuRW8wNENZcWtCc3pfQkQydEk0PXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3RyYWluLTE2NWQzIiwiYXVkIjoidHJhaW4tMTY1ZDMiLCJhdXRoX3RpbWUiOjE3NzgyMjk4MzAsInVzZXJfaWQiOiI3dTRHTFRrV2ZJTXBqSjhHd2pUYXlyNTJLa2IyIiwic3ViIjoiN3U0R0xUa1dmSU1wako4R3dqVGF5cjUyS2tiMiIsImlhdCI6MTc4NTA2MDI3MiwiZXhwIjoxNzg1MDYzODcyLCJlbWFpbCI6InBzcmloYXJpMjM4QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImFwcGxlLmNvbSI6WyIwMDA0ODguNzcwNDU1NTAyYjk4NGY1OWEyYjhiOWUwYzI0MDdmMTMuMDAwNiJdLCJnb29nbGUuY29tIjpbIjEwNzA0MDkyNzY4MjA3NTU0NDY4OSJdLCJlbWFpbCI6WyJwc3JpaGFyaTIzOEBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.AcN0NHMkfG1IUD4mgXlMO-ASgUzHjgK4Iebg-qipAM6P_elwVN37jpNUJV0zihwjY41GaNg7LXuYy5BOwWEAxRSbSY2URuEPxsVZK4FvmzRQKyLR46JhgZRdGNZPKrp_93U_zNudD49oL_ObLDwnnxG7vl44dCmHhHtjya2pSRFjka2gbgLe77mNxvOZOHoKcfjdKpC7JmXxIxr48aq-nQXMRmHYzQMNrl1orTFVzo9VtNi9sKIRwuxoKyE1xm0RoaVVnBrwHKHPZw5d7lXdQhlzVTl3Yad845leOuWP2I00er5gtoZZRVGFTNVfNRPH6fnI_ReZ963D8wQ1fSDa3w";
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

async function fetchMotraData() {
  const now = new Date();
  console.log("📡 Fetching Motra Muscle Recovery Telemetry...");

  try {
    const response = await axios.get("https://backend.motra.com/user/muscle-recovery", {
      headers: {
        "Host": "backend.motra.com",
        "Content-Type": "application/json",
        "Accept": "*/*",
        "User-Agent": "Motra/1 CFNetwork/3892.100.1 Darwin/27.0.0",
        "Authorization": `Bearer ${MOTRA_TOKEN}`,
        "Accept-Language": "en-IN,en;q=0.9"
      }
    });

    const data = response.data?.data || {};
    const muscleStats = data.musclesRecoveryStats || [];
    
    // Build map of all 18 muscles
    const musclesMap = {};
    muscleStats.forEach(m => {
      musclesMap[m.muscle] = {
        recovery: m.recovery ?? 100,
        daysToRecovery: m.daysToRecovery ?? 0,
        daysSinceLastUsed: m.daysSinceLastUsed ?? null
      };
    });

    // Calculate average recovery %
    let sumPct = 0;
    muscleStats.forEach(m => { sumPct += (m.recovery || 0); });
    const avgRecoveryPct = muscleStats.length > 0 ? (sumPct / muscleStats.length).toFixed(0) : "100";

    const payload = {
      lastUpdated: now.toISOString(),
      summary: {
        overallRecoveryPct: `${avgRecoveryPct}%`,
        recoveredMuscles: `${data.recoveredMuscles || muscleStats.length}/${muscleStats.length}`,
        recoveringMuscles: data.recoveringMuscles || 0,
        daysSinceLastWorkout: data.daysSinceLastWorkout || 0,
        totalMusclesTracked: muscleStats.length
      },
      musclesMap: musclesMap,
      musclesList: muscleStats.map(m => ({
        muscle: m.muscle,
        recovery: m.recovery,
        daysToRecovery: m.daysToRecovery,
        daysSinceLastUsed: m.daysSinceLastUsed
      }))
    };

    console.log("📊 Parsed Motra Telemetry for All 18 Muscles:");
    console.log(`   - Overall Recovery: ${payload.summary.overallRecoveryPct}`);
    console.log(`   - Recovered: ${payload.summary.recoveredMuscles} | Recovering: ${payload.summary.recoveringMuscles}`);
    console.log(`   - 18 Individual Muscles Processed:`, Object.keys(musclesMap).join(", "));

    // OVERWRITE/UPDATE canonical document 'motra_metrics' in Firestore
    await db.collection('api_feeds').doc('motra_metrics').set({
      apiName: 'MOTRA',
      source: 'Motra Fitness API',
      timestamp: FieldValue.serverTimestamp(),
      status: 'success',
      payload: payload
    }, { merge: true });

    console.log("✅ Successfully updated canonical Firestore document: 'api_feeds/motra_metrics'");
    process.exit(0);
  } catch (error) {
    console.error("❌ Motra API Error:", error.response ? error.response.status + " " + JSON.stringify(error.response.data) : error.message);
    process.exit(1);
  }
}

fetchMotraData();
