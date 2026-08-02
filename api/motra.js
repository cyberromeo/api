/**
 * Vercel Serverless API Endpoint for Motra Fitness (full gym data)
 * GET /api/motra
 *
 * Returns muscle recovery for all 18 muscles PLUS weekly stats, workout
 * history, per-muscle-group volume, streak, leaderboard rank and PRs.
 *
 * Query params:
 *   ?section=weekly|workouts|muscles|overall|groups   return just one section
 */

import { getDb } from './_firebase.js';

const ALL_MUSCLES = [
  'abductors', 'abs', 'adductors', 'biceps', 'calves', 'chest',
  'forearms', 'glutes', 'hamstrings', 'hipFlexors', 'lats', 'lowerBack',
  'obliques', 'quads', 'shoulders', 'tibialisAnterior', 'traps', 'triceps',
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function defaultMuscles() {
  const out = {};
  for (const m of ALL_MUSCLES) {
    out[m] = { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null, workoutDays: [] };
  }
  return out;
}

function emptyWeek() {
  return {
    weekStartDate: null,
    daysTrained: 0,
    totalWorkouts: 0,
    totalMinutes: 0,
    totalDuration: '0m',
    totalCalories: 0,
    totalSets: 0,
    totalReps: 0,
    totalVolumeKg: 0,
    days: WEEKDAYS.map((d) => ({
      date: null, weekday: d, workouts: 0, minutes: 0,
      calories: 0, sets: 0, reps: 0, tvl: 0, trained: false,
    })),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // shape returned when Firestore is unreachable or the doc is missing
    let data = {
      // --- existing keys, unchanged for backwards compatibility ---
      overall_recovery: '100%',
      recovered_muscles: `${ALL_MUSCLES.length}/${ALL_MUSCLES.length}`,
      recovering_muscles: 0,
      days_since_workout: 0,
      muscles: defaultMuscles(),
      updated_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),

      // --- new ---
      streak: { current_days: 0, minutes: 0, minutes_goal: 0 },
      lifetime: { workouts: 0, train_workouts: 0, external_workouts: 0 },
      last_workout: { name: null, date: null },
      weekly: emptyWeek(),
      overall: {
        lifetime_workouts: 0, period_workouts: 0, period_reps: 0, period_sets: 0,
        period_volume_kg: 0, period_calories: 0, period_minutes: 0,
        leaderboard_rank: null, leaderboard_prev_rank: null, leaderboard_delta: null,
        top_exercises: [],
      },
      muscle_groups: [],
      recent_workouts: [],
      workout_dates: [],
      muscles_needing_recovery: [],
      sync: { endpoints_ok: [], endpoints_failed: [], last_updated: null },
    };

    const db = getDb();
    const docSnap = await db.collection('api_feeds').doc('motra_metrics').get();

    if (docSnap.exists) {
      const doc = docSnap.data();
      const p = doc.payload || {};
      const summary = p.summary || {};

      // merge stored muscles over the full 18 so none ever go missing
      const muscles = defaultMuscles();
      for (const [key, m] of Object.entries(p.musclesMap || {})) {
        if (!m) continue;
        muscles[key] = {
          recovery: m.recovery ?? 100,
          daysToRecovery: m.daysToRecovery ?? 0,
          daysSinceLastUsed: m.daysSinceLastUsed ?? null,
          workoutDays: Array.isArray(m.workoutDays) ? m.workoutDays : [],
        };
      }

      const week = p.weeklyStats || {};
      const ov = p.overallStats || {};

      data = {
        overall_recovery: summary.overallRecoveryPct || '100%',
        recovered_muscles: summary.recoveredMuscles || `${ALL_MUSCLES.length}/${ALL_MUSCLES.length}`,
        recovering_muscles: summary.recoveringMuscles ?? 0,
        days_since_workout: summary.daysSinceLastWorkout ?? 0,
        muscles,
        updated_at: doc.timestamp?.toDate
          ? doc.timestamp.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),

        streak: {
          current_days: summary.currentStreak ?? 0,
          minutes: summary.streakWorkoutMinutes ?? 0,
          minutes_goal: summary.streakWorkoutMinutesMax ?? 0,
        },
        lifetime: {
          workouts: summary.lifetimeWorkouts ?? 0,
          train_workouts: summary.trainWorkouts ?? 0,
          external_workouts: summary.externalWorkouts ?? 0,
        },
        last_workout: {
          name: summary.lastWorkoutName ?? null,
          date: summary.lastWorkoutDate ?? null,
        },

        weekly: {
          week_start: week.weekStartDate ?? null,
          days_trained: week.daysTrained ?? 0,
          total_workouts: week.totalWorkouts ?? 0,
          total_minutes: week.totalMinutes ?? 0,
          total_duration: week.totalDuration ?? '0m',
          total_calories: week.totalCalories ?? 0,
          total_sets: week.totalSets ?? 0,
          total_reps: week.totalReps ?? 0,
          total_volume_kg: week.totalVolumeKg ?? 0,
          days: Array.isArray(week.days) && week.days.length ? week.days : emptyWeek().days,
        },

        overall: {
          lifetime_workouts: ov.lifetimeWorkouts ?? 0,
          period_workouts: ov.periodWorkouts ?? 0,
          period_reps: ov.periodReps ?? 0,
          period_sets: ov.periodSets ?? 0,
          period_volume_kg: ov.periodVolumeKg ?? 0,
          period_calories: ov.periodCalories ?? 0,
          period_minutes: ov.periodMinutes ?? 0,
          leaderboard_rank: ov.leaderboardRank ?? null,
          leaderboard_prev_rank: ov.leaderboardPrevRank ?? null,
          leaderboard_delta: ov.leaderboardDelta ?? null,
          top_exercises: ov.topExercises || [],
        },

        muscle_groups: (p.muscleGroupStats || []).map((g) => ({
          group: g.group,
          reps: g.reps ?? 0,
          sets: g.sets ?? 0,
          volume_kg: g.volumeKg ?? 0,
        })),

        recent_workouts: (p.recentWorkouts || []).map((w) => ({
          id: w.workoutID,
          name: w.name,
          date: w.date,
          duration: w.duration,
          minutes: w.minutes ?? 0,
          calories: w.calories ?? 0,
          volume_kg: w.volumeKg ?? 0,
          primary_muscles: w.primaryMuscles || [],
          secondary_muscles: w.secondaryMuscles || [],
          pr_count: w.prCount ?? 0,
          personal_records: (w.personalRecords || []).map((pr) => ({
            exercise: pr.exercise,
            type: pr.type,
            weight_kg: pr.weightKg ?? null,
          })),
        })),

        workout_dates: p.workoutDates || [],

        // convenience: only the muscles still recovering, worst first
        muscles_needing_recovery: (p.musclesList || [])
          .filter((m) => (m.recovery ?? 100) < 100)
          .map((m) => ({
            muscle: m.muscle,
            recovery: m.recovery,
            days_to_recovery: m.daysToRecovery ?? 0,
          })),

        sync: {
          endpoints_ok: p.meta?.endpointsOk || [],
          endpoints_failed: p.meta?.endpointsFailed || [],
          last_updated: p.lastUpdated ?? null,
        },
      };
    }

    // optional single-section response
    const sectionMap = {
      weekly: 'weekly',
      workouts: 'recent_workouts',
      muscles: 'muscles',
      overall: 'overall',
      groups: 'muscle_groups',
    };
    const section = req.query?.section;
    if (section && sectionMap[section]) {
      return res.status(200).json({
        status: 'success',
        widget: 'motra',
        section,
        data: data[sectionMap[section]],
      });
    }

    return res.status(200).json({
      status: 'success',
      widget: 'motra',
      provider: 'Motra Fitness',
      data,
    });
  } catch (error) {
    console.error('GET /api/motra error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
