/**
 * Vercel Serverless Master Endpoint for E-Paper Hardware Display
 * GET /api/dash
 * 
 * Consolidates all E-Paper widgets into a single optimized payload:
 * 1. Class Schedule: Today's class or "no class today"
 * 2. Exams: Upcoming exams with "Today" badge if scheduled on current date
 * 3. AC Power: Today, Week, Month kWh
 * 4. AI Usage: 5h, Weekly, Monthly limits & reset times
 * 5. Todoist Tasks: Filtered for today + overdue, separated into 'tasks' and 'shopping_list' with priority & completion
 * 6. MedX Tracker: Overall completion % out of 121 items
 * 7. MedX Study Time: Study time /11hrs and PYQ time /2hrs
 * 8. Motra Fitness: Overall recovery & all 18 individual muscles recovery stats
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

  const todayIsoDate = new Date().toISOString().split('T')[0];

  try {
    // Default Fallback Payload Structure
    const defaultMusclesMap = {
      abductors: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
      abs: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
      adductors: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
      biceps: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
      calves: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
      chest: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
      forearms: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
      glutes: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
      hamstrings: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
      hipFlexors: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
      lats: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
      lowerBack: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
      obliques: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
      quads: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
      shoulders: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
      tibialisAnterior: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
      traps: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null },
      triceps: { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null }
    };

    const responsePayload = {
      status: "success",
      endpoint: "/api/dash",
      epaper_display: "Universal E-Paper Dashboard",
      timestamp: new Date().toISOString(),
      data: {
        class_schedule: {
          status: "no class today",
          date: todayIsoDate,
          classes: []
        },
        exams: {
          total_upcoming: 2,
          upcoming_exams: [
            { subject: "Pathology Midterm Exam", date: "Today", is_today: true },
            { subject: "FMGE July Grand Test", date: "2026-08-15", is_today: false }
          ]
        },
        ac_power: {
          today_kwh: "5.08",
          week_kwh: "5.08",
          month_kwh: "80.76",
          unit: "kWh"
        },
        ai_usage: {
          rolling_5h: "0%",
          rolling_reset: "25 mins",
          weekly_usage: "22%",
          weekly_reset: "16 hours 50 mins",
          monthly_usage: "68%",
          monthly_reset: "12 days 8 hours"
        },
        todoist: {
          total_pending: 3,
          tasks: [
            { content: "Buy specs 👓", due: "this Sunday evening", priority: 1, is_overdue: true, completed: false },
            { content: "Book psychiatrist appointment", due: "2026-07-10", priority: 3, is_overdue: true, completed: false }
          ],
          shopping_list: [
            { content: "Whey protein", due: "No due date", priority: 1, is_overdue: false, completed: false }
          ]
        },
        medx_tracker: {
          completion_percentage: "0.0%",
          items_progress: "0/121",
          completed_items: 0,
          total_items: 121
        },
        medx_studytime: {
          study_hours: "0.00",
          study_goal: "11 hrs",
          study_progress: "0.00/11 hrs",
          pyq_hours: "0.00",
          pyq_goal: "2 hrs",
          pyq_progress: "0.00/2 hrs",
          streak_days: 0
        },
        motra: {
          overall_recovery: "100%",
          recovered_muscles: "18/18",
          recovering_muscles: 0,
          days_since_workout: 245,
          muscles: defaultMusclesMap
        }
      }
    };

    if (getApps().length) {
      const db = getFirestore();

      // 1. CLASS SCHEDULE
      const classSnap = await db.collection('api_feeds').doc('class_schedule').get();
      if (classSnap.exists) {
        const classPayload = classSnap.data().payload || {};
        const allClasses = classPayload.classes || [];
        
        // Filter classes scheduled for today or matching date
        const todayClasses = allClasses.filter(c => {
          if (!c.date) return true; // default include
          return c.date.includes(todayIsoDate);
        });

        if (todayClasses.length > 0) {
          responsePayload.data.class_schedule = {
            status: `${todayClasses.length} class(es) scheduled`,
            date: todayIsoDate,
            classes: todayClasses.map(c => ({
              subject: c.subject,
              date: c.date
            }))
          };
        } else {
          responsePayload.data.class_schedule = {
            status: "no class today",
            date: todayIsoDate,
            classes: []
          };
        }
      }

      // 2. EXAMS
      const examsSnap = await db.collection('api_feeds').doc('exams_schedule').get();
      if (examsSnap.exists) {
        const examsPayload = examsSnap.data().payload || {};
        const allExams = examsPayload.exams || [];

        const formattedExams = allExams.map(ex => {
          const isToday = ex.date && ex.date.includes(todayIsoDate);
          return {
            subject: ex.subject,
            date: isToday ? "Today" : ex.date,
            is_today: Boolean(isToday)
          };
        });

        responsePayload.data.exams = {
          total_upcoming: formattedExams.length,
          upcoming_exams: formattedExams
        };
      }

      // 3. AC POWER
      const acSnap = await db.collection('api_feeds').doc('ac_power_metrics').get();
      if (acSnap.exists) {
        const summary = acSnap.data().payload?.summary || {};
        responsePayload.data.ac_power = {
          today_kwh: String(summary.todayKwh ?? "0.00"),
          week_kwh: String(summary.thisWeekKwh ?? "0.00"),
          month_kwh: String(summary.thisMonthKwh ?? "0.00"),
          unit: summary.unit || "kWh"
        };
      }

      // 4. AI USAGE
      const aiSnap = await db.collection('api_feeds').doc('ai_usage_metrics').get();
      if (aiSnap.exists) {
        const summary = aiSnap.data().payload?.summary || {};
        responsePayload.data.ai_usage = {
          rolling_5h: `${summary.rolling?.percentage ?? 0}%`,
          rolling_reset: summary.rolling?.resetIn || "N/A",
          weekly_usage: `${summary.weekly?.percentage ?? 0}%`,
          weekly_reset: summary.weekly?.resetIn || "N/A",
          monthly_usage: `${summary.monthly?.percentage ?? 0}%`,
          monthly_reset: summary.monthly?.resetIn || "N/A"
        };
      }

      // 5. TODOIST (Tasks vs Shopping List)
      const todoistSnap = await db.collection('api_feeds').doc('todoist_metrics').get();
      if (todoistSnap.exists) {
        const payload = todoistSnap.data().payload || {};
        const rawTasks = payload.tasks || [];

        const tasksArr = [];
        const shoppingArr = [];

        rawTasks.forEach(t => {
          const contentLower = (t.content || "").toLowerCase();
          const labelsLower = (t.labels || []).map(l => String(l).toLowerCase());
          
          const isShopping = labelsLower.includes('shopping') || 
            contentLower.includes('shopping') || 
            contentLower.includes('buy') || 
            contentLower.includes('protein') || 
            contentLower.includes('whey');

          const formattedItem = {
            content: t.content,
            due: t.due,
            priority: t.priority || 1,
            is_overdue: Boolean(t.isOverdue),
            completed: false
          };

          if (isShopping) {
            shoppingArr.push(formattedItem);
          } else {
            tasksArr.push(formattedItem);
          }
        });

        responsePayload.data.todoist = {
          total_pending: rawTasks.length,
          tasks: tasksArr,
          shopping_list: shoppingArr
        };
      }

      // 6. MEDX TRACKER
      const trackerSnap = await db.collection('api_feeds').doc('medx_tracker').get();
      if (trackerSnap.exists) {
        const summary = trackerSnap.data().payload?.summary || {};
        responsePayload.data.medx_tracker = {
          completion_percentage: summary.completionPercentage || "0.0%",
          items_progress: `${summary.completedItems || 0}/${summary.totalItems || 121}`,
          completed_items: summary.completedItems || 0,
          total_items: summary.totalItems || 121
        };
      }

      // 7. MEDX STUDYTIME
      const studySnap = await db.collection('api_feeds').doc('medx_studytime').get();
      if (studySnap.exists) {
        const summary = studySnap.data().payload?.summary || {};
        const studyHrs = summary.todayStudyHours || "0.00";
        const pyqHrs = summary.todayPyqHours || "0.00";

        responsePayload.data.medx_studytime = {
          study_hours: studyHrs,
          study_goal: "11 hrs",
          study_progress: `${studyHrs}/11 hrs`,
          pyq_hours: pyqHrs,
          pyq_goal: "2 hrs",
          pyq_progress: `${pyqHrs}/2 hrs`,
          streak_days: summary.streakDays || 0
        };
      }

      // 8. MOTRA MUSCLE RECOVERY (All 18 Muscles)
      const motraSnap = await db.collection('api_feeds').doc('motra_metrics').get();
      if (motraSnap.exists) {
        const summary = motraSnap.data().payload?.summary || {};
        const musclesMap = motraSnap.data().payload?.musclesMap || defaultMusclesMap;

        responsePayload.data.motra = {
          overall_recovery: summary.overallRecoveryPct || "100%",
          recovered_muscles: summary.recoveredMuscles || "18/18",
          recovering_muscles: summary.recoveringMuscles ?? 0,
          days_since_workout: summary.daysSinceLastWorkout ?? 245,
          muscles: musclesMap
        };
      }
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("GET /api/dash error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
}
