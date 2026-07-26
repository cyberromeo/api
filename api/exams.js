/**
 * Vercel Serverless API Endpoint for Exams Schedule
 * GET /api/exams  -> Returns upcoming exams (Only subject and date)
 * POST /api/exams -> Pushes/updates exams schedule (Used by Hermes Agent)
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

  // --- POST /api/exams (Pushed by Hermes Agent) ---
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const examsList = Array.isArray(body.exams) ? body.exams : (body.data || []);

      const payload = {
        total_upcoming: examsList.length,
        exams: examsList.map((ex) => ({
          subject: ex.subject || ex.name || ex.title || "Exam",
          date: ex.date || "TBD"
        })),
        updated_at: new Date().toISOString()
      };

      if (getApps().length) {
        const db = getFirestore();
        await db.collection('api_feeds').doc('exams_schedule').set({
          apiName: 'EXAMS_SCHEDULE',
          source: body.source || 'Hermes Agent',
          timestamp: new Date(),
          status: 'success',
          payload: payload
        }, { merge: true });
      }

      return res.status(200).json({
        status: "success",
        message: "Exams schedule updated successfully",
        data: payload
      });
    } catch (err) {
      console.error("POST /api/exams error:", err);
      return res.status(500).json({ status: "error", message: err.message });
    }
  }

  // --- GET /api/exams (Fetched by E-Paper Screen / Clients) ---
  try {
    let payloadData = {
      total_upcoming: 2,
      exams: [
        { subject: "FMGE July Grand Test", date: "2026-08-15" },
        { subject: "Pathology Midterm Exam", date: "2026-08-01" }
      ],
      updated_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    if (getApps().length) {
      const db = getFirestore();
      const docSnap = await db.collection('api_feeds').doc('exams_schedule').get();

      if (docSnap.exists) {
        const docData = docSnap.data();
        const payload = docData.payload || {};
        payloadData = {
          total_upcoming: payload.total_upcoming ?? (payload.exams || []).length,
          exams: (payload.exams || []).map(ex => ({
            subject: ex.subject,
            date: ex.date
          })),
          updated_at: docData.timestamp?.toDate 
            ? docData.timestamp.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
      }
    }

    return res.status(200).json({
      status: "success",
      widget: "exams",
      data: payloadData
    });
  } catch (error) {
    console.error("GET /api/exams error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
}
