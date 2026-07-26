/**
 * Vercel Serverless API Endpoint for E-Paper Display Devices
 * GET /api/todoist
 * Returns clean, compact JSON payload for Todoist active tasks
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
      total_pending: 3,
      tasks: [
        { id: "1", content: "Buy specs 👓", due: "this Sunday evening", priority: 1, is_overdue: true },
        { id: "2", content: "Book psychiatrist appointment", due: "2026-07-10", priority: 3, is_overdue: true },
        { id: "3", content: "Whey protein", due: "No due date", priority: 1, is_overdue: false }
      ],
      updated_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    if (getApps().length) {
      const db = getFirestore();
      const docSnap = await db.collection('api_feeds').doc('todoist_metrics').get();

      if (docSnap.exists) {
        const docData = docSnap.data();
        const payload = docData.payload || {};
        payloadData = {
          total_pending: payload.totalPending ?? 0,
          tasks: (payload.tasks || []).map(t => ({
            id: t.id,
            content: t.content,
            due: t.due,
            priority: t.priority,
            is_overdue: t.isOverdue
          })),
          updated_at: docData.timestamp?.toDate 
            ? docData.timestamp.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
      }
    }

    return res.status(200).json({
      status: "success",
      widget: "todoist",
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
