/**
 * Vercel Serverless Study Progress Endpoint
 * GET /api/study
 * Returns only study telemetry: today's study hours vs 11 hrs goal, PYQ hours vs 2 hrs goal,
 * and MedX tracker completion (0/121 with completion percentage).
 */

import { getDb } from './_firebase.js';

const STUDY_GOAL_HRS = 11;
const PYQ_GOAL_HRS = 2;
const TOTAL_ITEMS = 121;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const data = {
      study_hours: "0.00",
      study_goal: `${STUDY_GOAL_HRS} hrs`,
      study_progress: `0.00/${STUDY_GOAL_HRS} hrs`,
      study_percentage: "0.0%",
      pyq_hours: "0.00",
      pyq_goal: `${PYQ_GOAL_HRS} hrs`,
      pyq_progress: `0.00/${PYQ_GOAL_HRS} hrs`,
      pyq_percentage: "0.0%",
      medx_tracker: {
        completion_percentage: "0.0%",
        items_progress: `0/${TOTAL_ITEMS}`,
        completed_items: 0,
        total_items: TOTAL_ITEMS
      },
      streak_days: 0,
      updated_at: new Date().toISOString()
    };

    const db = getDb();
    const docSnap = await db.collection('api_feeds').doc('medx_metrics').get();

    if (docSnap.exists) {
      const summary = docSnap.data().payload?.summary || {};

      const studyHrs = Number(summary.todayStudyHours || 0);
      const pyqHrs = Number(summary.todayPyqHours || 0);
      const completedItems = Number(summary.completedItems || 0);

      const studyPct = STUDY_GOAL_HRS > 0 ? Math.min(100, (studyHrs / STUDY_GOAL_HRS) * 100).toFixed(1) : "0.0";
      const pyqPct = PYQ_GOAL_HRS > 0 ? Math.min(100, (pyqHrs / PYQ_GOAL_HRS) * 100).toFixed(1) : "0.0";

      data.study_hours = studyHrs.toFixed(2);
      data.study_progress = `${studyHrs.toFixed(2)}/${STUDY_GOAL_HRS} hrs`;
      data.study_percentage = `${studyPct}%`;
      data.pyq_hours = pyqHrs.toFixed(2);
      data.pyq_progress = `${pyqHrs.toFixed(2)}/${PYQ_GOAL_HRS} hrs`;
      data.pyq_percentage = `${pyqPct}%`;
      data.medx_tracker = {
        completion_percentage: summary.completionPercentage || "0.0%",
        items_progress: `${completedItems}/${TOTAL_ITEMS}`,
        completed_items: completedItems,
        total_items: TOTAL_ITEMS
      };
      data.streak_days = Number(summary.streakDays || 0);

      const timestamp = docSnap.data().timestamp;
      data.updated_at = timestamp?.toDate
        ? timestamp.toDate().toISOString()
        : new Date().toISOString();
    }

    return res.status(200).json({
      status: "success",
      widget: "study",
      data
    });
  } catch (error) {
    console.error("GET /api/study error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
}
