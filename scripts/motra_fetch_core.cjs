/**
 * Motra Fetch Core — shared logic for the full gym data pull.
 *
 * Designed to be BOTH:
 *   - require()'d by scripts/motra_worker.cjs (writes via firebase-admin)
 *   - inlined verbatim into the Cronicle shell-plugin script
 *     by scripts/setup_cronicle_motra_job.cjs (writes via Firestore REST)
 *
 * So: no require() of anything outside Node builtins, and no top-level await.
 *
 * Endpoints pulled (all GET, read-only):
 *   /user/weekly-workout-summary/v3   muscle recovery + workoutDays + streak + lifetime
 *   /user/muscle-recovery             recoveredMuscles / recoveringMuscles / daysSinceLastWorkout
 *   /stats/trends/v2                  per-day workouts, time, calories, sets, reps, TVL
 *   /user/stats/overall               period + lifetime totals, leaderboard, top exercises
 *   /user/stats/muscle-group          reps / TVL / sets per muscle group
 *   /user/calendar-workouts/v3        workout IDs keyed by date
 *   /user/{uid}/workouts/v2/          recent workouts w/ name, duration, TVL, PRs
 *   /user/workout/count               { train, external }
 */

const FIREBASE_API_KEY = 'AIzaSyADtP9ZTyPUIqk7T9xHvEuEXhe--IYYLWw';
const MOTRA_BASE = 'https://backend.motra.com';
const UID = '7u4GLTkWfIMpjJ8GwjTayr52Kkb2';

const ALL_MUSCLES = [
  'abductors', 'abs', 'adductors', 'biceps', 'calves', 'chest',
  'forearms', 'glutes', 'hamstrings', 'hipFlexors', 'lats', 'lowerBack',
  'obliques', 'quads', 'shoulders', 'tibialisAnterior', 'traps', 'triceps',
];

/** Mint a fresh Firebase ID token (valid ~60 min) from a long-lived refresh token. */
async function mintIdToken(refreshToken) {
  const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  const j = await res.json();
  return { idToken: j.id_token, refreshToken: j.refresh_token, userId: j.user_id };
}

/** GET one Motra endpoint. Never throws — returns null on failure so one bad
 *  endpoint can't take out the whole sync. */
async function getJson(idToken, pathAndQuery, label) {
  try {
    const res = await fetch(`${MOTRA_BASE}${pathAndQuery}`, {
      headers: {
        Accept: '*/*',
        'Accept-Language': 'en-IN,en;q=0.9',
        'User-Agent': 'Motra/1 CFNetwork/3892.100.1 Darwin/27.0.0',
        Authorization: `Bearer ${idToken}`,
      },
    });
    if (!res.ok) {
      console.error(`   ⚠️  ${label}: HTTP ${res.status}`);
      return null;
    }
    const j = await res.json();
    return j && j.success ? j.data : null;
  } catch (err) {
    console.error(`   ⚠️  ${label}: ${err.message}`);
    return null;
  }
}

/** Monday 00:00 local of the current week, as a unix seconds timestamp. */
function weekStartUnix(now) {
  const d = new Date(now);
  const dow = d.getDay();               // 0=Sun
  const back = dow === 0 ? 6 : dow - 1; // walk back to Monday
  d.setDate(d.getDate() - back);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

/** Round to at most `p` decimal places, returning a Number. */
function round(n, p) {
  if (n == null || Number.isNaN(Number(n))) return 0;
  const f = Math.pow(10, p || 0);
  return Math.round(Number(n) * f) / f;
}

function fmtHrsMins(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Fetch every gym endpoint and fold them into one flat payload.
 * Returns the payload object ready to be written to Firestore.
 */
async function fetchAllGymData(idToken, nowMs) {
  const now = nowMs || Date.now();
  const nowSec = Math.floor(now / 1000);
  const weekStart = weekStartUnix(now);
  const rangeStart = nowSec - 30 * 86400; // 30d window for the calendar
  const wq = `startTimestamp=${weekStart}&endTimestamp=${nowSec}`;

  console.log('📡 Fetching 8 Motra endpoints...');

  const [weekly, recovery, trends, overall, muscleGroup, calendar, workouts, count] =
    await Promise.all([
      getJson(idToken, '/user/weekly-workout-summary/v3', 'weekly-summary'),
      getJson(idToken, '/user/muscle-recovery', 'muscle-recovery'),
      getJson(idToken, `/stats/trends/v2?${wq}`, 'stats-trends'),
      getJson(idToken, `/user/stats/overall?${wq}`, 'stats-overall'),
      getJson(idToken, `/user/stats/muscle-group?${wq}`, 'stats-muscle-group'),
      getJson(idToken, `/user/calendar-workouts/v3?startTimestamp=${rangeStart}&endTimestamp=${nowSec}`, 'calendar-workouts'),
      getJson(idToken, `/user/${UID}/workouts/v2/?size=20`, 'workouts-list'),
      getJson(idToken, '/user/workout/count', 'workout-count'),
    ]);

  // ---- muscles: prefer weekly-summary (it carries workoutDays), fall back to recovery
  const muscleStats =
    (weekly && weekly.musclesRecoveryStats) ||
    (recovery && recovery.musclesRecoveryStats) ||
    [];

  const musclesMap = {};
  for (const m of ALL_MUSCLES) {
    musclesMap[m] = { recovery: 100, daysToRecovery: 0, daysSinceLastUsed: null, workoutDays: [] };
  }
  let sumPct = 0;
  for (const m of muscleStats) {
    sumPct += m.recovery || 0;
    musclesMap[m.muscle] = {
      recovery: m.recovery != null ? m.recovery : 100,
      daysToRecovery: m.daysToRecovery != null ? m.daysToRecovery : 0,
      daysSinceLastUsed: m.daysSinceLastUsed != null ? m.daysSinceLastUsed : null,
      workoutDays: Array.isArray(m.workoutDays) ? m.workoutDays : [],
    };
  }
  const avgRecovery = muscleStats.length ? Math.round(sumPct / muscleStats.length) : 100;

  // sorted worst-first so the display can show what still needs rest
  const musclesList = ALL_MUSCLES
    .map((k) => Object.assign({ muscle: k }, musclesMap[k]))
    .sort((a, b) => a.recovery - b.recovery);

  // ---- weekly stats: per-day rows from /stats/trends/v2
  const dayRows = (trends && trends.stats) || [];
  const weekTotals = { workouts: 0, seconds: 0, calories: 0, sets: 0, reps: 0, tvl: 0 };
  const days = dayRows.map((d) => {
    weekTotals.workouts += d.totalWorkouts || 0;
    weekTotals.seconds += d.totalWorkoutTime || 0;
    weekTotals.calories += d.totalCalories || 0;
    weekTotals.sets += d.totalSets || 0;
    weekTotals.reps += d.totalReps || 0;
    weekTotals.tvl += d.totalTVL || 0;
    return {
      date: d.date,
      weekday: new Date(`${d.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' }),
      workouts: d.totalWorkouts || 0,
      minutes: Math.round((d.totalWorkoutTime || 0) / 60),
      calories: d.totalCalories || 0,
      sets: d.totalSets || 0,
      reps: d.totalReps || 0,
      tvl: round(d.totalTVL, 0),
      trained: (d.totalWorkouts || 0) > 0,
    };
  });

  const weeklyStats = {
    weekStartDate: new Date(weekStart * 1000).toISOString().slice(0, 10),
    daysTrained: days.filter((d) => d.trained).length,
    totalWorkouts: weekTotals.workouts,
    totalMinutes: Math.round(weekTotals.seconds / 60),
    totalDuration: fmtHrsMins(weekTotals.seconds),
    totalCalories: weekTotals.calories,
    totalSets: weekTotals.sets,
    totalReps: weekTotals.reps,
    totalVolumeKg: round(weekTotals.tvl, 0),
    days: days,
  };

  // ---- lifetime / period aggregates from /user/stats/overall
  const o = overall || {};
  const lb = o.leaderboardRanking || {};
  const rankDelta =
    lb.prevRanking != null && lb.currentRanking != null ? lb.prevRanking - lb.currentRanking : null;

  const overallStats = {
    lifetimeWorkouts: o.lifetimeWorkouts || 0,
    periodWorkouts: o.totalWorkouts || 0,
    periodReps: o.totalReps || 0,
    periodSets: o.totalSets || 0,
    periodVolumeKg: round(o.totalTvl, 0),
    periodCalories: o.totalCalories || 0,
    periodMinutes: o.totalWorkoutTime || 0,
    leaderboardRank: lb.currentRanking != null ? lb.currentRanking : null,
    leaderboardPrevRank: lb.prevRanking != null ? lb.prevRanking : null,
    leaderboardDelta: rankDelta, // positive = climbed
    topExercises: (o.topUserExercises || []).map((e) => e.presentationName).filter(Boolean),
  };

  // ---- per-muscle-group split from /user/stats/muscle-group
  const mg = muscleGroup || {};
  const groupKeys = Object.keys(
    Object.assign({}, mg.repsStats || {}, mg.tvlStats || {}, mg.setsStats || {})
  );
  const muscleGroupStats = groupKeys
    .map((g) => ({
      group: g,
      reps: (mg.repsStats || {})[g] || 0,
      sets: (mg.setsStats || {})[g] || 0,
      volumeKg: round((mg.tvlStats || {})[g], 0),
    }))
    .sort((a, b) => b.volumeKg - a.volumeKg);

  // ---- recent workouts from /user/{uid}/workouts/v2/
  const rawWorkouts = (workouts && workouts.items) || [];
  const recentWorkouts = rawWorkouts.map((w) => {
    const startMs = (w.timeStarted || 0) * 1000;
    const prs = (w.achievements || [])
      .filter((a) => a.category === 'PR' && a.setDetails)
      .map((a) => ({
        exercise: a.setDetails.exerciseName || a.setDetails.exerciseID || '',
        type: a.type || '',
        weightKg: a.setDetails.weight ? round(a.setDetails.weight.value, 1) : null,
        unit: a.setDetails.weight ? a.setDetails.weight.unit || 'kg' : null,
      }));
    return {
      workoutID: w.workoutID,
      name: w.name || 'Workout',
      date: new Date(startMs).toISOString().slice(0, 10),
      startedAt: new Date(startMs).toISOString(),
      minutes: Math.round((w.timeActive || 0) / 60),
      duration: fmtHrsMins(w.timeActive),
      calories: (w.statistics && w.statistics.calories) || 0,
      volumeKg: w.statistics && w.statistics.tvl ? round(w.statistics.tvl.value, 0) : 0,
      primaryMuscles: (w.muscleGroups && w.muscleGroups.primary) || [],
      secondaryMuscles: (w.muscleGroups && w.muscleGroups.secondary) || [],
      format: w.workoutFormat || '',
      prCount: prs.length,
      personalRecords: prs,
    };
  });

  // ---- calendar: flatten date -> [workouts] into a sorted list of trained dates
  const cal = calendar || {};
  const workoutDates = Object.keys(cal)
    .sort()
    .reverse()
    .map((date) => ({
      date: date,
      count: Array.isArray(cal[date]) ? cal[date].length : 0,
      workoutIDs: (cal[date] || []).map((w) => w.workoutID),
    }));

  // ---- streak + counts
  const streak = (weekly && weekly.streakDetails) || {};
  const streakMinutes = (streak.stats && streak.stats.workoutMinutes) || {};
  const rec = recovery || {};
  const cnt = count || {};

  const lastWorkout = recentWorkouts.length ? recentWorkouts[0] : null;

  const payload = {
    lastUpdated: new Date(now).toISOString(),

    // kept identical in shape to the previous version so existing
    // consumers (/api/dash, e-paper display) keep working unchanged
    summary: {
      overallRecoveryPct: `${avgRecovery}%`,
      recoveredMuscles: `${rec.recoveredMuscles != null ? rec.recoveredMuscles : muscleStats.length}/${ALL_MUSCLES.length}`,
      recoveringMuscles: rec.recoveringMuscles || 0,
      daysSinceLastWorkout: rec.daysSinceLastWorkout != null ? rec.daysSinceLastWorkout : 0,
      totalMusclesTracked: ALL_MUSCLES.length,
      currentStreak: streak.currentStreak || 0,
      streakWorkoutMinutes: streakMinutes.current || 0,
      streakWorkoutMinutesMax: streakMinutes.max || 0,
      lifetimeWorkouts: (weekly && weekly.lifetimeWorkouts) || o.lifetimeWorkouts || 0,
      trainWorkouts: cnt.train || 0,
      externalWorkouts: cnt.external || 0,
      lastWorkoutName: lastWorkout ? lastWorkout.name : null,
      lastWorkoutDate: lastWorkout ? lastWorkout.date : null,
    },

    musclesMap: musclesMap,
    musclesList: musclesList,

    // everything below is new
    weeklyStats: weeklyStats,
    overallStats: overallStats,
    muscleGroupStats: muscleGroupStats,
    recentWorkouts: recentWorkouts,
    workoutDates: workoutDates,

    meta: {
      endpointsOk: [
        weekly && 'weekly-summary',
        recovery && 'muscle-recovery',
        trends && 'stats-trends',
        overall && 'stats-overall',
        muscleGroup && 'stats-muscle-group',
        calendar && 'calendar-workouts',
        workouts && 'workouts-list',
        count && 'workout-count',
      ].filter(Boolean),
      endpointsFailed: [
        !weekly && 'weekly-summary',
        !recovery && 'muscle-recovery',
        !trends && 'stats-trends',
        !overall && 'stats-overall',
        !muscleGroup && 'stats-muscle-group',
        !calendar && 'calendar-workouts',
        !workouts && 'workouts-list',
        !count && 'workout-count',
      ].filter(Boolean),
    },
  };

  console.log(`   ✅ ${payload.meta.endpointsOk.length}/8 endpoints ok` +
    (payload.meta.endpointsFailed.length ? ` (failed: ${payload.meta.endpointsFailed.join(', ')})` : ''));

  return payload;
}

function logPayloadSummary(p) {
  const s = p.summary;
  const w = p.weeklyStats;
  console.log('📊 Motra gym snapshot');
  console.log(`   recovery      ${s.overallRecoveryPct} | recovered ${s.recoveredMuscles} | recovering ${s.recoveringMuscles}`);
  console.log(`   streak        ${s.currentStreak}d | lifetime ${s.lifetimeWorkouts} workouts | last: ${s.lastWorkoutName || 'n/a'} (${s.lastWorkoutDate || 'n/a'})`);
  console.log(`   this week     ${w.daysTrained}d trained | ${w.totalWorkouts} workouts | ${w.totalDuration} | ${w.totalVolumeKg}kg | ${w.totalSets} sets | ${w.totalReps} reps | ${w.totalCalories} kcal`);
  console.log(`   muscle groups ${p.muscleGroupStats.map((g) => `${g.group} ${g.volumeKg}kg`).join(', ') || 'none'}`);
  console.log(`   rank          #${p.overallStats.leaderboardRank != null ? p.overallStats.leaderboardRank : '?'}` +
    (p.overallStats.leaderboardDelta ? ` (${p.overallStats.leaderboardDelta > 0 ? '+' : ''}${p.overallStats.leaderboardDelta})` : ''));
  console.log(`   workouts kept ${p.recentWorkouts.length} recent, ${p.workoutDates.length} dates in last 30d`);
}

module.exports = {
  FIREBASE_API_KEY,
  MOTRA_BASE,
  UID,
  ALL_MUSCLES,
  mintIdToken,
  getJson,
  weekStartUnix,
  round,
  fmtHrsMins,
  fetchAllGymData,
  logPayloadSummary,
};

