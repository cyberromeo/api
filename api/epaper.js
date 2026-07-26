/**
 * Vercel Serverless Master Endpoint for E-Paper Hardware Display
 * GET /api/epaper
 * Consolidates AC Power + AI Usage + Todoist + MedX + Motra + Class Schedule + Exams for single-fetch rendering
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
    console.error("Firebase init error:", err);
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
    const responsePayload = {
      epaper_device: "Universal E-Paper Screen",
      timestamp: new Date().toISOString(),
      widgets: {
        ac_power: {
          today_kwh: "5.08",
          week_kwh: "5.08",
          month_kwh: "80.76",
          unit: "kWh"
        },
        ai_usage: {
          rolling_5h: "0%",
          rolling_reset: "29 mins",
          weekly_usage: "22%",
          weekly_reset: "16 hours",
          monthly_usage: "68%",
          monthly_reset: "12 days"
        },
        todoist: {
          total_pending: 3,
          tasks: [
            { content: "Buy specs 👓", due: "this Sunday evening", priority: 1, is_overdue: true },
            { content: "Book psychiatrist appointment", due: "2026-07-10", priority: 3, is_overdue: true },
            { content: "Whey protein", due: "No due date", priority: 1, is_overdue: false }
          ]
        },
        medx_tracker: {
          completion_percentage: "0.0%",
          subjects_progress: "0/19",
          gts_progress: "0/7",
          items_progress: "0/121"
        },
        medx_studytime: {
          today_study_hrs: "0.00",
          today_pyq_hrs: "0.00",
          streak_days: 0,
          weekly_total_hrs: "0.17"
        },
        motra: {
          overall_recovery: "100%",
          recovered_muscles: "18/18",
          recovering_muscles: 0,
          days_since_workout: 245
        },
        class_schedule: {
          date: new Date().toISOString().split('T')[0],
          total_classes: 3,
          classes: [
            { subject: "Pathology Lecture", time: "09:00 AM - 10:30 AM", room: "Hall A", topic: "Cell Injury" },
            { subject: "Pharmacology Practical", time: "11:00 AM - 01:00 PM", room: "Lab 2", topic: "Autonomic NS" }
          ]
        },
        exams: {
          total_upcoming: 2,
          exams: [
            { name: "FMGE July 2026 Grand Test", date: "2026-08-15", days_remaining: 20, venue: "Exam Hall 1" },
            { name: "Pathology Midterm Exam", date: "2026-08-01", days_remaining: 6, venue: "Hall B" }
          ]
        }
      }
    };

    if (getApps().length) {
      const db = getFirestore();
      
      // Fetch AC POWER
      const acSnap = await db.collection('api_feeds').doc('ac_power_metrics').get();
      if (acSnap.exists) {
        const summary = acSnap.data().payload?.summary || {};
        responsePayload.widgets.ac_power = {
          today_kwh: String(summary.todayKwh ?? "0.0"),
          week_kwh: String(summary.thisWeekKwh ?? "0.0"),
          month_kwh: String(summary.thisMonthKwh ?? "0.0"),
          unit: summary.unit || "kWh"
        };
      }

      // Fetch AI USAGE
      const aiSnap = await db.collection('api_feeds').doc('ai_usage_metrics').get();
      if (aiSnap.exists) {
        const summary = aiSnap.data().payload?.summary || {};
        responsePayload.widgets.ai_usage = {
          rolling_5h: `${summary.rolling?.percentage ?? 0}%`,
          rolling_reset: summary.rolling?.resetIn || "N/A",
          weekly_usage: `${summary.weekly?.percentage ?? 0}%`,
          weekly_reset: summary.weekly?.resetIn || "N/A",
          monthly_usage: `${summary.monthly?.percentage ?? 0}%`,
          monthly_reset: summary.monthly?.resetIn || "N/A"
        };
      }

      // Fetch TODOIST
      const todoistSnap = await db.collection('api_feeds').doc('todoist_metrics').get();
      if (todoistSnap.exists) {
        const payload = todoistSnap.data().payload || {};
        responsePayload.widgets.todoist = {
          total_pending: payload.totalPending ?? 0,
          tasks: (payload.tasks || []).map(t => ({
            content: t.content,
            due: t.due,
            priority: t.priority,
            is_overdue: t.isOverdue
          }))
        };
      }

      // Fetch MEDX TRACKER
      const medxTrackerSnap = await db.collection('api_feeds').doc('medx_tracker').get();
      if (medxTrackerSnap.exists) {
        const summary = medxTrackerSnap.data().payload?.summary || {};
        responsePayload.widgets.medx_tracker = {
          completion_percentage: summary.completionPercentage || "0.0%",
          subjects_progress: `${summary.completedSubjects || 0}/${summary.totalSubjects || 19}`,
          gts_progress: `${summary.completedGts || 0}/${summary.totalGts || 7}`,
          items_progress: `${summary.completedItems || 0}/${summary.totalItems || 121}`
        };
      }

      // Fetch MEDX STUDYTIME
      const medxStudySnap = await db.collection('api_feeds').doc('medx_studytime').get();
      if (medxStudySnap.exists) {
        const summary = medxStudySnap.data().payload?.summary || {};
        responsePayload.widgets.medx_studytime = {
          today_study_hrs: summary.todayStudyHours || "0.00",
          today_pyq_hrs: summary.todayPyqHours || "0.00",
          streak_days: summary.streakDays || 0,
          weekly_total_hrs: summary.weeklyGrandTotalHours || "0.00"
        };
      }

      // Fetch MOTRA MUSCLE RECOVERY
      const motraSnap = await db.collection('api_feeds').doc('motra_metrics').get();
      if (motraSnap.exists) {
        const summary = motraSnap.data().payload?.summary || {};
        responsePayload.widgets.motra = {
          overall_recovery: summary.overallRecoveryPct || "100%",
          recovered_muscles: summary.recoveredMuscles || "18/18",
          recovering_muscles: summary.recoveringMuscles ?? 0,
          days_since_workout: summary.daysSinceLastWorkout ?? 245
        };
      }

      // Fetch CLASS SCHEDULE
      const classSnap = await db.collection('api_feeds').doc('class_schedule').get();
      if (classSnap.exists) {
        const payload = classSnap.data().payload || {};
        responsePayload.widgets.class_schedule = {
          date: payload.date || new Date().toISOString().split('T')[0],
          total_classes: payload.total_classes ?? (payload.classes || []).length,
          classes: payload.classes || []
        };
      }

      // Fetch EXAMS SCHEDULE
      const examsSnap = await db.collection('api_feeds').doc('exams_schedule').get();
      if (examsSnap.exists) {
        const payload = examsSnap.data().payload || {};
        responsePayload.widgets.exams = {
          total_upcoming: payload.total_upcoming ?? (payload.exams || []).length,
          exams: payload.exams || []
        };
      }
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
