/**
 * Vercel Serverless API Endpoint for E-Paper Display Devices
 * GET /api/medx
 * Returns clean, compact JSON payload for MedX Study Time & Tracker Progress (0/19 subjects, 0/7 GTs, 0/121 items)
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

  try {
    let payloadData = {
      completion_percentage: "0.0%",
      subjects_progress: "0/19",
      gts_progress: "0/7",
      items_progress: "0/121",
      today_study_hrs: "0.00",
      today_pyq_hrs: "0.00",
      streak_days: 0,
      weekly_total_hrs: "0.17",
      updated_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    if (getApps().length) {
      const db = getFirestore();
      const docSnap = await db.collection('api_feeds').doc('medx_metrics').get();

      if (docSnap.exists) {
        const docData = docSnap.data();
        const summary = docData.payload?.summary || {};
        payloadData = {
          completion_percentage: summary.completionPercentage || "0.0%",
          subjects_progress: `${summary.completedSubjects || 0}/${summary.totalSubjects || 19}`,
          gts_progress: `${summary.completedGts || 0}/${summary.totalGts || 7}`,
          items_progress: `${summary.completedItems || 0}/${summary.totalItems || 121}`,
          today_study_hrs: summary.todayStudyHours || "0.00",
          today_pyq_hrs: summary.todayPyqHours || "0.00",
          streak_days: summary.streakDays || 0,
          weekly_total_hrs: summary.weeklyGrandTotalHours || "0.00",
          updated_at: docData.timestamp?.toDate 
            ? docData.timestamp.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
      }
    }

    return res.status(200).json({
      status: "success",
      widget: "medx",
      provider: "MedX Learning",
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
