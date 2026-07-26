const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const envLocal = fs.readFileSync('../medx/medx/.env.local', 'utf-8');
const clientEmail = envLocal.match(/FIREBASE_CLIENT_EMAIL="([^"]+)"/)[1];
const privateKey = envLocal.match(/FIREBASE_PRIVATE_KEY="([^"]+)"/)[1].replace(/\\n/g, '\n');

const medxApp = initializeApp({
  credential: cert({
    projectId: 'medx-e9acd',
    clientEmail,
    privateKey
  })
}, 'medxApp4');

const medxDb = getFirestore(medxApp);

async function inspectUserProgress() {
  const snap = await medxDb.collection('user_progress').get();
  console.log(`📋 'user_progress' Collection: ${snap.docs.length} docs`);
  
  snap.docs.forEach(doc => {
    console.log(`   └─ Doc '${doc.id}' data:`, JSON.stringify(doc.data()));
  });

  const logsSnap = await medxDb.collection('studyTimeLogs').get();
  console.log(`\n⏱️ 'studyTimeLogs' Collection: ${logsSnap.docs.length} logs`);
  logsSnap.docs.forEach(doc => {
    console.log(`   └─ Log '${doc.id}':`, JSON.stringify(doc.data()));
  });

  process.exit(0);
}

inspectUserProgress().catch(console.error);
