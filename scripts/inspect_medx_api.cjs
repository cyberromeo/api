/**
 * Inspector for MedX Tracker & Study Time APIs
 * Domain: https://medx.srihari.quest
 */

const axios = require('axios');

async function testMedXApis() {
  console.log("📡 Fetching MedX Tracker & Study Time APIs...");

  // 1. Fetch Tracker API
  try {
    const trackerRes = await axios.get("https://medx.srihari.quest/api/tracker?userId=NpFFvozZSFWnCKdmutkISEGPf8o2");
    console.log("\n✅ Tracker API Status:", trackerRes.status);
    console.log("Tracker Data Keys:", Object.keys(trackerRes.data));
    const subjects = trackerRes.data.subjects || {};
    const gts = trackerRes.data.gts || {};
    console.log(`Tracker Summary: ${Object.keys(subjects).length} subjects tracked, ${Object.keys(gts).length} GTs tracked.`);
  } catch (err) {
    console.error("Tracker API Error:", err.response ? err.response.status + " " + JSON.stringify(err.response.data) : err.message);
  }

  // 2. Fetch Study Time API
  try {
    const studyRes = await axios.get("https://medx.srihari.quest/api/studytime?password=superstudiopro");
    console.log("\n✅ Study Time API Status:", studyRes.status);
    const state = studyRes.data.state || {};
    console.log("📊 Study Time Data Summary:");
    console.log(`   - Today Study: ${state.todayStudyHours} hrs (${state.todayStudySeconds}s)`);
    console.log(`   - Today PYQ: ${state.todayPyqHours} hrs (${state.todayPyqSeconds}s)`);
    console.log(`   - Study Streak: ${state.streak} days | PYQ Streak: ${state.streakPyq} days`);
    console.log(`   - Weekly Grand Total: ${state.weeklyGrandTotalHours} hrs`);
    console.log(`   - Active Timer:`, state.activeTimer || "None");
  } catch (err) {
    console.error("Study Time API Error:", err.response ? err.response.status + " " + JSON.stringify(err.response.data) : err.message);
  }
}

testMedXApis();
