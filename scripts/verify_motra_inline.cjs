/**
 * Verify the Cronicle inline script — simplified version.
 * Requires setup_cronicle_motra_job.cjs as a module and checks the script it exports.
 */
const vm = require('vm');

console.log('--- loading setup script as module ---');
const { inlineScript } = require('./setup_cronicle_motra_job.cjs');
console.log(`generated ${inlineScript.length} chars`);

// 1. syntax check
console.log('\n--- syntax check ---');
try {
  new vm.Script(inlineScript, { filename: 'motra_inline.cjs' });
  console.log('✅ syntax OK');
} catch (err) {
  console.error('❌ syntax error:', err.message);
  process.exit(1);
}

// 2. no project-local requires
console.log('\n--- dependency check ---');
const requires = [...inlineScript.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
if (requires.length) {
  console.error('❌ inline script requires modules:', requires.join(', '));
  process.exit(1);
}
console.log('✅ no require() calls — fully self-contained');

// 3. confirm pieces
console.log('\n--- content check ---');
const needed = [
  'mintIdToken', 'fetchAllGymData', 'logPayloadSummary', 'toFirestoreValue',
  'weekly-workout-summary/v3', 'stats/trends/v2', 'user/stats/overall',
  'stats/muscle-group', 'calendar-workouts/v3', 'workouts/v2', 'workout/count',
];
let missing = false;
for (const n of needed) {
  const ok = inlineScript.includes(n);
  console.log(`   ${ok ? '✅' : '❌'} ${n}`);
  if (!ok) missing = true;
}
if (missing) process.exit(1);

// 4. token embedded
console.log('\n--- token check ---');
const hasToken = /const REFRESH_TOKEN = "AMf-/.test(inlineScript);
console.log(hasToken ? '✅ refresh token embedded' : '❌ refresh token missing');
if (!hasToken) process.exit(1);

console.log(`\n✅ inline script verified — ready to push to Cronicle`);
