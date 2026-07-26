/**
 * Vercel Serverless API Endpoint for E-Paper Display Devices
 * GET /api/ac-power
 * Returns clean, compact JSON payload reading directly from canonical document 'ac_power_metrics'
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
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
      today_kwh: "5.08",
      week_kwh: "5.08",
      month_kwh: "80.76",
      unit: "kWh",
      updated_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    if (getApps().length) {
      const db = getFirestore();
      const docSnap = await db.collection('api_feeds').doc('ac_power_metrics').get();

      if (docSnap.exists) {
        const docData = docSnap.data();
        const summary = docData.payload?.summary || {};
        payloadData = {
          today_kwh: String(summary.todayKwh ?? "0.0"),
          week_kwh: String(summary.thisWeekKwh ?? "0.0"),
          month_kwh: String(summary.thisMonthKwh ?? "0.0"),
          unit: summary.unit || "kWh",
          updated_at: docData.timestamp?.toDate 
            ? docData.timestamp.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
      }
    }

    return res.status(200).json({
      status: "success",
      widget: "ac_power",
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
