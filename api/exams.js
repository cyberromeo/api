/**
 * Vercel Serverless API Endpoint for Exams Schedule
 * GET /api/exams  -> Returns upcoming exams for E-Paper / Clients
 * POST /api/exams -> Pushes/updates exams schedule (Used by Hermes Agent / Automation)
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
        exams: examsList.map((ex, i) => {
          const examDate = new Date(ex.date);
          const now = new Date();
          let daysRemaining = null;
          if (!isNaN(examDate.getTime())) {
            daysRemaining = Math.max(0, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 3600 * 24)));
          }

          return {
            id: ex.id || `ex_${i + 1}`,
            name: ex.name || ex.title || "Exam",
            subject: ex.subject || "",
            date: ex.date || "TBD",
            time: ex.time || "09:00 AM",
            days_remaining: daysRemaining ?? ex.days_remaining ?? 0,
            venue: ex.venue || ex.location || "Main Hall",
            total_marks: ex.total_marks || 100
          };
        }),
        updated_by: body.source || "Hermes Agent",
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
        { id: "ex_1", name: "FMGE July 2026 Mock Exam", subject: "All Subjects", date: "2026-08-15", time: "09:00 AM", days_remaining: 20, venue: "Exam Hall 1", total_marks: 300 },
        { id: "ex_2", name: "Pathology Midterm", subject: "Pathology", date: "2026-08-01", time: "10:00 AM", days_remaining: 6, venue: "Hall B", total_marks: 100 }
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
          exams: payload.exams || [],
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
