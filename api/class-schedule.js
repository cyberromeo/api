/**
 * Vercel Serverless API Endpoint for Class Schedule
 * GET /api/class-schedule  -> Returns class schedule (Only subject and date)
 * POST /api/class-schedule -> Pushes/updates class schedule (Used by Hermes Agent)
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- POST /api/class-schedule (Pushed by Hermes Agent) ---
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const classes = Array.isArray(body.classes) ? body.classes : (body.data || body.schedule || []);

      const payload = {
        total_classes: classes.length,
        classes: classes.map((c) => ({
          subject: c.subject || c.name || c.title || "Class",
          date: c.date || c.time || new Date().toISOString().split('T')[0]
        })),
        updated_at: new Date().toISOString()
      };

      if (getApps().length) {
        const db = getFirestore();
        await db.collection('api_feeds').doc('class_schedule').set({
          apiName: 'CLASS_SCHEDULE',
          source: body.source || 'Hermes Agent',
          timestamp: new Date(),
          status: 'success',
          payload: payload
        }, { merge: true });
      }

      return res.status(200).json({
        status: "success",
        message: "Class schedule updated successfully",
        data: payload
      });
    } catch (err) {
      console.error("POST /api/class-schedule error:", err);
      return res.status(500).json({ status: "error", message: err.message });
    }
  }

  // --- GET /api/class-schedule (Fetched by E-Paper Screen / Clients) ---
  try {
    let payloadData = {
      total_classes: 2,
      classes: [
        { subject: "Pathology Lecture", date: "2026-07-26 09:00 AM" },
        { subject: "Pharmacology Practical", date: "2026-07-26 11:00 AM" }
      ],
      updated_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    if (getApps().length) {
      const db = getFirestore();
      const docSnap = await db.collection('api_feeds').doc('class_schedule').get();

      if (docSnap.exists) {
        const docData = docSnap.data();
        const payload = docData.payload || {};
        payloadData = {
          total_classes: payload.total_classes ?? (payload.classes || []).length,
          classes: (payload.classes || []).map(c => ({
            subject: c.subject,
            date: c.date
          })),
          updated_at: docData.timestamp?.toDate 
            ? docData.timestamp.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
      }
    }

    return res.status(200).json({
      status: "success",
      widget: "class_schedule",
      data: payloadData
    });
  } catch (error) {
    console.error("GET /api/class-schedule error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
}
