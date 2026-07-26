/**
 * Vercel Serverless API Endpoint for E-Paper Display Devices
 * GET /api/ai-usage
 * Returns clean, compact JSON payload for OpenCode AI limits & reset timers
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
      rolling_5h: "0%",
      rolling_reset: "29 mins",
      weekly_usage: "22%",
      weekly_reset: "16 hours",
      monthly_usage: "68%",
      monthly_reset: "12 days",
      updated_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    if (getApps().length) {
      const db = getFirestore();
      const docSnap = await db.collection('api_feeds').doc('ai_usage_metrics').get();

      if (docSnap.exists) {
        const docData = docSnap.data();
        const summary = docData.payload?.summary || {};
        payloadData = {
          rolling_5h: `${summary.rolling?.percentage ?? 0}%`,
          rolling_reset: summary.rolling?.resetIn || "N/A",
          weekly_usage: `${summary.weekly?.percentage ?? 0}%`,
          weekly_reset: summary.weekly?.resetIn || "N/A",
          monthly_usage: `${summary.monthly?.percentage ?? 0}%`,
          monthly_reset: summary.monthly?.resetIn || "N/A",
          updated_at: docData.timestamp?.toDate 
            ? docData.timestamp.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
      }
    }

    return res.status(200).json({
      status: "success",
      widget: "ai_usage",
      provider: "OpenCode AI",
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
