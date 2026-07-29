const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function getQod() {
  try {
    const commonHeaders = {
        "Host": "api.arisemedicalacademy.com",
        "Accept": "application/json, text/plain, */*",
        "appVersion": "1.5.7",
        "Origin": "capacitor://localhost",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
        "DeviceId": "54B4406E-A891-4769-BB6D-2C714C967ED0",
        "DeviceInfo": "{\"model\":\"iPhone15,2\",\"osVersion\":\"27.0\",\"manufacturer\":\"Apple\",\"platform\":\"ios\"}",
        "tenantId": "43IBMyiA8DBM",
        "Accept-Language": "en-IN,en;q=0.9",
        "deviceType": "ios",
        "appId": "mobile",
        "userEmail": "psrihari238@gmail.com"
    };

    console.log("Logging into Arise Medical Academy API...");
    const loginRes = await fetch('https://api.arisemedicalacademy.com/instituteApp/auth/loginV2', {
      method: 'POST',
      headers: { ...commonHeaders, "Content-Type": "application/json", "X-Request-Id": crypto.randomUUID() },
      body: JSON.stringify({ userEmail: 'psrihari238@gmail.com', password: 'Sri@1405' })
    });
    
    if (loginRes.status !== 200) {
      throw new Error(`Login failed with status ${loginRes.status}`);
    }

    const loginData = await loginRes.json();
    const token = loginData.result;
    console.log("Login successful. Fetching QOD...");
    
    const qodRes = await fetch('https://api.arisemedicalacademy.com/instituteApp/library/getQuestionOfTheDay', {
      method: 'GET',
      headers: { 
          ...commonHeaders,
          'Authorization': `Bearer ${token}`,
          "X-Request-Id": crypto.randomUUID()
      }
    });

    if (qodRes.status !== 200) {
      const text = await qodRes.text();
      console.log("Error body:", text);
      throw new Error(`QOD fetch failed with status ${qodRes.status}`);
    }

    const qodData = await qodRes.json();
    if (!qodData || !qodData.result || !qodData.result.question) {
       throw new Error("Invalid QOD response format");
    }

    const questionObj = qodData.result.question;
    const finalData = {
      questionId: questionObj.questionId,
      question: questionObj.question,
      plainQuestion: questionObj.plainQuestion,
      ansExplanation: questionObj.ansExplanation,
      answers: (questionObj.answers || []).map(ans => ({
        answerId: ans.answerId,
        answer: ans.answer,
        correct: ans.correct
      })),
      subject: qodData.result.subject || "General",
      fetchedAt: new Date().toISOString()
    };

    console.log(`Fetched Question: ${finalData.plainQuestion.substring(0, 50)}...`);

    // Initialize Firebase
    console.log("Initializing Firebase...");
    const serviceAccountPath = path.join(__dirname, '../epaper-api-key-firebase-adminsdk-fbsvc-14ee0d69d4.json');
    let serviceAccount;
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else {
      throw new Error("Could not find Firebase credentials");
    }

    if (!getApps().length) {
      initializeApp({ credential: cert(serviceAccount) });
    }
    const db = getFirestore();

    // Save to Firestore
    console.log("Saving to Firestore...");
    await db.collection('qod').doc('latest').set(finalData);
    
    // Optional: Also save a historical record
    const today = new Date().toISOString().split('T')[0];
    await db.collection('qod').doc(today).set(finalData);

    console.log("Successfully saved QOD to Firebase!");
    process.exit(0);

  } catch (err) {
    console.error("Error in getQod:", err);
    process.exit(1);
  }
}

getQod();
