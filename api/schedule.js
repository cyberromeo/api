/**
 * Unified Serverless API Endpoint for Schedule & Exams
 * POST /api/schedule -> Pushes both 'classes' and 'exams' in a single HTTP request (Used by Hermes Agent)
 * GET /api/schedule  -> Returns combined classes and exams schedule
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

  // --- POST /api/schedule (Single unified push from Hermes Agent) ---
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const responseData = {};

      if (getApps().length) {
        const db = getFirestore();

        // 1. Process 'classes' if present in request body
        if (Array.isArray(body.classes)) {
          const classPayload = {
            total_classes: body.classes.length,
            classes: body.classes.map((c) => ({
              subject: c.subject || c.name || c.title || "Subject",
              start_date: c.start_date || c.date || new Date().toISOString().split('T')[0],
              end_date: c.end_date || c.start_date || c.date || new Date().toISOString().split('T')[0]
            })),
            updated_at: new Date().toISOString()
          };

          await db.collection('api_feeds').doc('class_schedule').set({
            apiName: 'CLASS_SCHEDULE',
            source: body.source || 'Hermes Agent',
            timestamp: new Date(),
            status: 'success',
            payload: classPayload
          }, { merge: true });

          responseData.classes = classPayload;
        }

        // 2. Process 'exams' if present in request body
        if (Array.isArray(body.exams)) {
          const examsPayload = {
            total_upcoming: body.exams.length,
            exams: body.exams.map((ex) => ({
              subject: ex.subject || ex.name || ex.title || "Exam",
              date: ex.date || "TBD"
            })),
            updated_at: new Date().toISOString()
          };

          await db.collection('api_feeds').doc('exams_schedule').set({
            apiName: 'EXAMS_SCHEDULE',
            source: body.source || 'Hermes Agent',
            timestamp: new Date(),
            status: 'success',
            payload: examsPayload
          }, { merge: true });

          responseData.exams = examsPayload;
        }
      }

      return res.status(200).json({
        status: "success",
        message: "Unified schedule updated successfully",
        data: responseData
      });
    } catch (err) {
      console.error("POST /api/schedule error:", err);
      return res.status(500).json({ status: "error", message: err.message });
    }
  }

  // --- GET /api/schedule (Fetched by Clients) ---
  try {
    let classesData = { total_classes: 0, classes: [] };
    let examsData = { total_upcoming: 0, exams: [] };

    if (getApps().length) {
      const db = getFirestore();

      const classSnap = await db.collection('api_feeds').doc('class_schedule').get();
      if (classSnap.exists) {
        const payload = classSnap.data().payload || {};
        classesData = {
          total_classes: payload.total_classes ?? (payload.classes || []).length,
          classes: (payload.classes || []).map(c => ({
            subject: c.subject,
            start_date: c.start_date,
            end_date: c.end_date
          }))
        };
      }

      const examsSnap = await db.collection('api_feeds').doc('exams_schedule').get();
      if (examsSnap.exists) {
        const payload = examsSnap.data().payload || {};
        examsData = {
          total_upcoming: payload.total_upcoming ?? (payload.exams || []).length,
          exams: (payload.exams || []).map(ex => ({
            subject: ex.subject,
            date: ex.date
          }))
        };
      }
    }

    return res.status(200).json({
      status: "success",
      data: {
        classes: classesData,
        exams: examsData,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("GET /api/schedule error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
}
