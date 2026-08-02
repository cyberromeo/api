/**
 * Vercel Serverless Master Endpoint for E-Paper Hardware Display
 * GET /api/dash
 */

import { getDb } from './_firebase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const todayIsoDate = new Date().toISOString().split('T')[0];

  try {
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

    const dashData = {
      timestamp: new Date().toISOString(),
      class_schedule: {
        status: "no class today",
        date: todayIsoDate,
        classes: []
      },
      exams: {
        total_upcoming: 0,
        upcoming_exams: []
      },
      ac_power: {
        today_kwh: "0.00",
        week_kwh: "0.00",
        month_kwh: "0.00",
        unit: "kWh"
      },
      ai_usage: {
        rolling_5h: "0%",
        rolling_reset: "N/A",
        weekly_usage: "0%",
        weekly_reset: "N/A",
        monthly_usage: "0%",
        monthly_reset: "N/A"
      },
      todoist: {
        total_pending: 0,
        tasks: [],
        shopping_list: []
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
        days_since_workout: 0,
        muscles: defaultMusclesMap,
        streak_days: 0,
        lifetime_workouts: 0,
        last_workout: null,
        week_days_trained: 0,
        week_workouts: 0,
        week_duration: "0m",
        week_volume_kg: 0,
        week_sets: 0,
        week_reps: 0,
        week_calories: 0,
        week_days: [],
        leaderboard_rank: null,
        muscle_groups: [],
        recent_workouts: []
      }
    };

    const db = getDb();

    // 1. CLASS SCHEDULE
    const classSnap = await db.collection('api_feeds').doc('class_schedule').get();
    if (classSnap.exists) {
      const classPayload = classSnap.data().payload || {};
      const allClasses = classPayload.classes || [];
      
      const activeTodayClasses = allClasses.filter(c => {
        const s = c.start_date || c.date;
        const e = c.end_date || s;
        if (!s) return true;
        return s <= todayIsoDate && todayIsoDate <= e;
      });

      if (activeTodayClasses.length > 0) {
        dashData.class_schedule = {
          status: `${activeTodayClasses.length} class(es) scheduled`,
          date: todayIsoDate,
          classes: activeTodayClasses.map(c => ({
            subject: c.subject,
            start_date: c.start_date,
            end_date: c.end_date
          }))
        };
      } else {
        dashData.class_schedule = {
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

      const validExams = allExams.filter(ex => ex.date && ex.date >= todayIsoDate);
      const sortedExams = (validExams.length > 0 ? validExams : allExams)
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

      if (sortedExams.length > 0) {
        const next = sortedExams[0];
        const isToday = next.date && next.date.includes(todayIsoDate);
        const formattedNext = {
          subject: next.subject,
          date: isToday ? "Today" : next.date
        };

        dashData.exams = {
          total_upcoming: validExams.length,
          next_exam: formattedNext,
          upcoming_exams: [formattedNext]
        };
      } else {
        dashData.exams = {
          total_upcoming: 0,
          next_exam: null,
          upcoming_exams: []
        };
      }
    }

    // 3. AC POWER
    const acSnap = await db.collection('api_feeds').doc('ac_power_metrics').get();
    if (acSnap.exists) {
      const summary = acSnap.data().payload?.summary || {};
      dashData.ac_power = {
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
      dashData.ai_usage = {
        rolling_5h: `${summary.rolling?.percentage ?? 0}%`,
        rolling_reset: summary.rolling?.resetIn || "N/A",
        weekly_usage: `${summary.weekly?.percentage ?? 0}%`,
        weekly_reset: summary.weekly?.resetIn || "N/A",
        monthly_usage: `${summary.monthly?.percentage ?? 0}%`,
        monthly_reset: summary.monthly?.resetIn || "N/A"
      };
    }

    // 5. TODOIST
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

      dashData.todoist = {
        total_pending: rawTasks.length,
        tasks: tasksArr,
        shopping_list: shoppingArr
      };
    }

    // 6. MEDX TRACKER
    const trackerSnap = await db.collection('api_feeds').doc('medx_tracker').get();
    if (trackerSnap.exists) {
      const summary = trackerSnap.data().payload?.summary || {};
      dashData.medx_tracker = {
        completion_percentage: summary.completionPercentage || "0.0%",
        items_progress: `${summary.completedItems || 0}/121`,
        completed_items: summary.completedItems || 0,
        total_items: 121
      };
    }

    // 7. MEDX STUDYTIME
    const studySnap = await db.collection('api_feeds').doc('medx_studytime').get();
    if (studySnap.exists) {
      const summary = studySnap.data().payload?.summary || {};
      const studyHrs = summary.todayStudyHours || "0.00";
      const pyqHrs = summary.todayPyqHours || "0.00";

      dashData.medx_studytime = {
        study_hours: studyHrs,
        study_goal: "11 hrs",
        study_progress: `${studyHrs}/11 hrs`,
        pyq_hours: pyqHrs,
        pyq_goal: "2 hrs",
        pyq_progress: `${pyqHrs}/2 hrs`,
        streak_days: summary.streakDays || 0
      };
    }

    // 8. MOTRA MUSCLE RECOVERY
    const motraSnap = await db.collection('api_feeds').doc('motra_metrics').get();
    if (motraSnap.exists) {
      const summary = motraSnap.data().payload?.summary || {};
      const rawMusclesMap = motraSnap.data().payload?.musclesMap || {};

      const fullMusclesMap = { ...defaultMusclesMap };
      Object.keys(rawMusclesMap).forEach(key => {
        if (rawMusclesMap[key]) {
          fullMusclesMap[key] = {
            recovery: rawMusclesMap[key].recovery ?? 100,
            daysToRecovery: rawMusclesMap[key].daysToRecovery ?? 0,
            daysSinceLastUsed: rawMusclesMap[key].daysSinceLastUsed ?? null
          };
        }
      });

      const motraPayload = motraSnap.data().payload || {};
      const week = motraPayload.weeklyStats || {};
      const ov = motraPayload.overallStats || {};

      dashData.motra = {
        overall_recovery: summary.overallRecoveryPct || "100%",
        recovered_muscles: summary.recoveredMuscles || "18/18",
        recovering_muscles: summary.recoveringMuscles ?? 0,
        days_since_workout: summary.daysSinceLastWorkout ?? 0,
        muscles: fullMusclesMap,

        streak_days: summary.currentStreak ?? 0,
        lifetime_workouts: summary.lifetimeWorkouts ?? 0,
        last_workout: summary.lastWorkoutName
          ? { name: summary.lastWorkoutName, date: summary.lastWorkoutDate ?? null }
          : null,

        week_days_trained: week.daysTrained ?? 0,
        week_workouts: week.totalWorkouts ?? 0,
        week_duration: week.totalDuration ?? "0m",
        week_volume_kg: week.totalVolumeKg ?? 0,
        week_sets: week.totalSets ?? 0,
        week_reps: week.totalReps ?? 0,
        week_calories: week.totalCalories ?? 0,
        week_days: (week.days || []).map(d => ({
          weekday: d.weekday,
          date: d.date,
          trained: Boolean(d.trained),
          minutes: d.minutes ?? 0,
          volume_kg: d.tvl ?? 0
        })),

        leaderboard_rank: ov.leaderboardRank ?? null,

        muscle_groups: (motraPayload.muscleGroupStats || []).map(g => ({
          group: g.group,
          reps: g.reps ?? 0,
          sets: g.sets ?? 0,
          volume_kg: g.volumeKg ?? 0
        })),

        // keep the e-paper payload small: 3 most recent workouts
        recent_workouts: (motraPayload.recentWorkouts || []).slice(0, 3).map(w => ({
          name: w.name,
          date: w.date,
          duration: w.duration,
          volume_kg: w.volumeKg ?? 0,
          calories: w.calories ?? 0,
          primary_muscles: w.primaryMuscles || [],
          pr_count: w.prCount ?? 0
        }))
      };
    }

    return res.status(200).json(dashData);
  } catch (error) {
    console.error("GET /api/dash error:", error);
    return res.status(500).json({ error: error.message });
  }
}
