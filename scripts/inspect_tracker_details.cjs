const axios = require('axios');

async function inspectTrackerDetails() {
  const trackerRes = await axios.get("https://medx.srihari.quest/api/tracker?userId=NpFFvozZSFWnCKdmutkISEGPf8o2");
  const data = trackerRes.data;

  const subjects = data.subjects || {};
  const gts = data.gts || {};

  let totalItemsCount = 0;
  let completedItemsCount = 0;

  Object.entries(subjects).forEach(([subKey, subVal]) => {
    Object.entries(subVal).forEach(([fieldKey, isDone]) => {
      totalItemsCount++;
      if (isDone) completedItemsCount++;
    });
  });

  let totalGtsCount = Object.keys(gts).length || 7;
  let completedGtsCount = 0;
  Object.values(gts).forEach(val => {
    if (val) completedGtsCount++;
  });

  let totalSubjectsCount = Object.keys(subjects).length || 19;
  let completedSubjectsCount = 0;
  Object.values(subjects).forEach(subObj => {
    const vals = Object.values(subObj);
    if (vals.length > 0 && vals.every(v => Boolean(v))) {
      completedSubjectsCount++;
    }
  });

  const completionPct = totalItemsCount > 0 ? ((completedItemsCount / totalItemsCount) * 100).toFixed(1) : "0.0";

  console.log("📊 MedX Tracker Detail Inspection:");
  console.log(`   - Total Items: ${totalItemsCount} (Completed: ${completedItemsCount})`);
  console.log(`   - Total GTs: ${totalGtsCount} (Completed: ${completedGtsCount})`);
  console.log(`   - Total Subjects: ${totalSubjectsCount} (Completed: ${completedSubjectsCount})`);
  console.log(`   - Overall Completion: ${completionPct}%`);
  console.log("\nFull Subjects Keys & Items count per subject:");
  Object.entries(subjects).forEach(([subKey, subVal]) => {
    console.log(`     ${subKey}: ${Object.keys(subVal).length} items`);
  });
}

inspectTrackerDetails();
