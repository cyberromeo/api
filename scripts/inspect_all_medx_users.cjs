const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const envLocal = fs.readFileSync('../medx/medx/.env.local', 'utf-8');

const emailMatch = envLocal.match(/FIREBASE_CLIENT_EMAIL="([^"]+)"/);
const keyMatch = envLocal.match(/FIREBASE_PRIVATE_KEY="([^"]+)"/);

const clientEmail = emailMatch[1];
const privateKey = keyMatch[1].replace(/\\n/g, '\n');

const medxApp = initializeApp({
  credential: cert({
    projectId: 'medx-e9acd',
    clientEmail: clientEmail,
    privateKey: privateKey
  })
}, 'medxApp');

const medxDb = getFirestore(medxApp);

async function inspectMedXDb() {
  console.log("📡 Connecting to MedX Firebase (medx-e9acd)...");

  // 1. Inspect user_tracker collection
  const trackerDocs = await medxDb.collection('user_tracker').get();
  console.log(`\n📋 'user_tracker' Collection Docs Count: ${trackerDocs.docs.length}`);
  trackerDocs.docs.forEach(doc => {
    console.log(`\n  📄 Doc ID (UID): ${doc.id}`);
    const data = doc.data();
    const subjects = data.subjects || {};
    const gts = data.gts || {};

    let completedItems = 0;
    Object.values(subjects).forEach(subObj => {
      Object.values(subObj).forEach(val => {
        if (val) completedItems++;
      });
    });
    Object.values(gts).forEach(val => {
      if (val) completedItems++;
    });

    console.log(`     Completed Items: ${completedItems}/121`);
    console.log(`     Subjects tracked: ${Object.keys(subjects).length}, GTs tracked: ${Object.keys(gts).length}`);
  });

  // 2. Inspect studyTime collection
  const studyDocs = await medxDb.collection('studyTime').get();
  console.log(`\n⏱️ 'studyTime' Collection Docs Count: ${studyDocs.docs.length}`);
  studyDocs.docs.forEach(doc => {
    console.log(`\n  📄 Doc ID: ${doc.id}`);
    const data = doc.data();
    console.log(`     Today Study Seconds: ${data.todayStudySeconds || 0} (${((data.todayStudySeconds || 0)/3600).toFixed(2)}h)`);
    console.log(`     Today PYQ Seconds: ${data.todayPyqSeconds || 0}`);
    console.log(`     Streak: ${data.streak || 0}`);
    console.log(`     Weekly Grand Total: ${data.weeklyGrandTotalHours || 0}h`);
  });

  process.exit(0);
}

inspectMedXDb().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
