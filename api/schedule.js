/**
 * Unified Serverless API Endpoint for Schedule & Exams
 * POST /api/schedule
 * GET /api/schedule
 */

import { getDb } from './_firebase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- POST /api/schedule ---
  if (req.method === 'POST') {
    try {
      let body = req.body || {};
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e) {}
      }

      const responseData = {};
      const source = body.source || 'Hermes Agent';

      let classesInput = null;
      let examsInput = null;

      if (Array.isArray(body)) {
        const hasExamKeys = body.some(item => item.date && !item.start_date);
        if (hasExamKeys) {
          examsInput = body;
        } else {
          classesInput = body;
        }
      } else if (body.classes || body.schedule || body.class) {
        classesInput = Array.isArray(body.classes) ? body.classes : 
                       Array.isArray(body.schedule) ? body.schedule : 
                       Array.isArray(body.class) ? body.class : [body.class || body.schedule];
      } else if (body.exams || body.exam) {
        examsInput = Array.isArray(body.exams) ? body.exams : [body.exam];
      } else if (body.subject) {
        if (body.start_date || body.end_date) {
          classesInput = [body];
        } else {
          examsInput = [body];
        }
      }

      if (body.exams && Array.isArray(body.exams)) {
        examsInput = body.exams;
      }
      if (body.classes && Array.isArray(body.classes)) {
        classesInput = body.classes;
      }

      const db = getDb();

      // 1. Process Classes
      if (classesInput && classesInput.length > 0) {
        const classPayload = {
          total_classes: classesInput.length,
          classes: classesInput.map((c) => ({
            subject: c.subject || c.name || c.title || "Subject",
            start_date: c.start_date || c.date || new Date().toISOString().split('T')[0],
            end_date: c.end_date || c.start_date || c.date || new Date().toISOString().split('T')[0]
          })),
          updated_at: new Date().toISOString()
        };

        await db.collection('api_feeds').doc('class_schedule').set({
          apiName: 'CLASS_SCHEDULE',
          source: source,
          timestamp: new Date(),
          status: 'success',
          payload: classPayload
        }, { merge: true });

        responseData.classes = classPayload;
      }

      // 2. Process Exams
      if (examsInput && examsInput.length > 0) {
        const examsPayload = {
          total_upcoming: examsInput.length,
          exams: examsInput.map((ex) => ({
            subject: ex.subject || ex.name || ex.title || "Exam",
            date: ex.date || ex.start_date || "TBD"
          })),
          updated_at: new Date().toISOString()
        };

        await db.collection('api_feeds').doc('exams_schedule').set({
          apiName: 'EXAMS_SCHEDULE',
          source: source,
          timestamp: new Date(),
          status: 'success',
          payload: examsPayload
        }, { merge: true });

        responseData.exams = examsPayload;
      }

      return res.status(200).json({
        status: "success",
        message: "Schedule updated successfully in Firestore",
        data: responseData
      });
    } catch (err) {
      console.error("POST /api/schedule error:", err);
      return res.status(500).json({ status: "error", message: err.message });
    }
  }

  // --- GET /api/schedule ---
  try {
    const db = getDb();
    let classesData = { total_classes: 0, classes: [] };
    let examsData = { total_upcoming: 0, exams: [] };

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
