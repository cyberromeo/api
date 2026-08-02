/**
 * Read api_feeds/motra_metrics back from Firestore and run it through the same
 * mapping logic as api/motra.js + api/dash.js, so we can confirm the endpoints
 * will serve correct data without deploying.
 */
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const sa = require(path.resolve(__dirname, '..', 'epaper-api-key-firebase-adminsdk-fbsvc-14ee0d69d4.json'));
if (!getApps().length) initializeApp({ credential: cert(sa) });

(async () => {
  const db = getFirestore();
  const snap = await db.collection('api_feeds').doc('motra_metrics').get();
  if (!snap.exists) {
    console.error('❌ api_feeds/motra_metrics does not exist');
    process.exit(1);
  }

  const doc = snap.data();
  const p = doc.payload || {};

  console.log('=== document meta ===');
  console.log(`  apiName   ${doc.apiName}`);
  console.log(`  source    ${doc.source}`);
  console.log(`  status    ${doc.status}`);
  console.log(`  timestamp ${doc.timestamp?.toDate?.().toISOString() || doc.timestamp}`);
  console.log(`  payload keys: ${Object.keys(p).join(', ')}`);

  console.log('\n=== round-trip type check ===');
  const checks = [
    ['summary.currentStreak', typeof p.summary?.currentStreak, 'number'],
    ['summary.lifetimeWorkouts', typeof p.summary?.lifetimeWorkouts, 'number'],
    ['summary.lastWorkoutName', typeof p.summary?.lastWorkoutName, 'string'],
    ['weeklyStats.totalVolumeKg', typeof p.weeklyStats?.totalVolumeKg, 'number'],
    ['weeklyStats.days', Array.isArray(p.weeklyStats?.days) ? 'array' : typeof p.weeklyStats?.days, 'array'],
    ['weeklyStats.days[0].trained', typeof p.weeklyStats?.days?.[0]?.trained, 'boolean'],
    ['overallStats.leaderboardRank', typeof p.overallStats?.leaderboardRank, 'number'],
    ['overallStats.topExercises', Array.isArray(p.overallStats?.topExercises) ? 'array' : typeof p.overallStats?.topExercises, 'array'],
    ['muscleGroupStats', Array.isArray(p.muscleGroupStats) ? 'array' : typeof p.muscleGroupStats, 'array'],
    ['recentWorkouts', Array.isArray(p.recentWorkouts) ? 'array' : typeof p.recentWorkouts, 'array'],
    ['workoutDates', Array.isArray(p.workoutDates) ? 'array' : typeof p.workoutDates, 'array'],
    ['musclesMap.chest.recovery', typeof p.musclesMap?.chest?.recovery, 'number'],
    ['musclesMap.abs.workoutDays', Array.isArray(p.musclesMap?.abs?.workoutDays) ? 'array' : typeof p.musclesMap?.abs?.workoutDays, 'array'],
  ];
  let bad = 0;
  for (const [name, got, want] of checks) {
    const ok = got === want;
    if (!ok) bad++;
    console.log(`  ${ok ? '✅' : '❌'} ${name.padEnd(34)} ${got}${ok ? '' : `  (expected ${want})`}`);
  }

  console.log('\n=== what /api/dash will serve for motra ===');
  const week = p.weeklyStats || {};
  const ov = p.overallStats || {};
  const s = p.summary || {};
  console.log(JSON.stringify({
    overall_recovery: s.overallRecoveryPct,
    recovered_muscles: s.recoveredMuscles,
    days_since_workout: s.daysSinceLastWorkout,
    streak_days: s.currentStreak,
    lifetime_workouts: s.lifetimeWorkouts,
    last_workout: s.lastWorkoutName ? { name: s.lastWorkoutName, date: s.lastWorkoutDate } : null,
    week_days_trained: week.daysTrained,
    week_workouts: week.totalWorkouts,
    week_duration: week.totalDuration,
    week_volume_kg: week.totalVolumeKg,
    week_sets: week.totalSets,
    week_reps: week.totalReps,
    week_calories: week.totalCalories,
    week_days: (week.days || []).map((d) => `${d.weekday}${d.trained ? `:${d.minutes}m` : ''}`),
    leaderboard_rank: ov.leaderboardRank,
    muscle_groups: (p.muscleGroupStats || []).map((g) => `${g.group} ${g.volumeKg}kg`),
    recent_workouts: (p.recentWorkouts || []).slice(0, 3).map((w) => `${w.date} ${w.name} (${w.duration}, ${w.volumeKg}kg, ${w.prCount} PR)`),
  }, null, 2));

  console.log('\n=== muscles still recovering ===');
  const recovering = (p.musclesList || []).filter((m) => (m.recovery ?? 100) < 100);
  if (!recovering.length) console.log('  (all recovered)');
  for (const m of recovering) {
    console.log(`  ${m.muscle.padEnd(16)} ${m.recovery}%  ${m.daysToRecovery}d to full`);
  }

  console.log('\n=== sync health ===');
  console.log(`  ok:     ${(p.meta?.endpointsOk || []).join(', ')}`);
  console.log(`  failed: ${(p.meta?.endpointsFailed || []).join(', ') || '(none)'}`);

  const docBytes = Buffer.byteLength(JSON.stringify(p), 'utf8');
  console.log(`\n  payload size: ${docBytes} bytes (Firestore limit 1048576)`);

  process.exit(bad ? 1 : 0);
})();
