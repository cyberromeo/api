/**
 * Vercel Serverless API Endpoint for Motra Fitness
 * GET /api/motra
 * Returns summary AND all 18 individual muscle recovery metrics
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
    if (serviceAccount.project_id) {
      initializeApp({ credential: cert(serviceAccount) });
    }
  } catch (err) {
    console.error("Firebase Admin init error:", err);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const defaultMuscles = {
    abductors: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    abs: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    adductors: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    biceps: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    calves: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    chest: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    forearms: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    glutes: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    hamstrings: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    hipFlexors: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    lats: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    lowerBack: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    obliques: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    quads: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    shoulders: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    tibialisAnterior: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    traps: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
    triceps: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null }
  };

  try {
    let payloadData = {
      overall_recovery: "100%",
      recovered_muscles: "18/18",
      recovering_muscles: 0,
      days_since_workout: 245,
      muscles: defaultMuscles,
      updated_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    if (getApps().length) {
      const db = getFirestore();
      const docSnap = await db.collection('api_feeds').doc('motra_metrics').get();

      if (docSnap.exists) {
        const docData = docSnap.data();
        const summary = docData.payload?.summary || {};
        const rawMusclesMap = docData.payload?.musclesMap || {};

        const fullMusclesMap = { ...defaultMuscles };
        Object.keys(rawMusclesMap).forEach(key => {
          if (rawMusclesMap[key]) {
            fullMusclesMap[key] = {
              recovery: rawMusclesMap[key].recovery ?? 100,
              daysToRecovery: rawMusclesMap[key].daysToRecovery ?? 0,
              daysSinceLastUsed: rawMusclesMap[key].daysSinceLastUsed ?? null
            };
          }
        });

        payloadData = {
          overall_recovery: summary.overallRecoveryPct || "100%",
          recovered_muscles: summary.recoveredMuscles || "18/18",
          recovering_muscles: summary.recoveringMuscles ?? 0,
          days_since_workout: summary.daysSinceLastWorkout ?? 245,
          muscles: fullMusclesMap,
          updated_at: docData.timestamp?.toDate 
            ? docData.timestamp.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
      }
    }

    return res.status(200).json({
      status: "success",
      widget: "motra",
      provider: "Motra Fitness",
      data: payloadData
    });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
}
