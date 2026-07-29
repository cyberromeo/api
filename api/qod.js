/**
 * Vercel Serverless API Endpoint for Question of the Day (QOD)
 * GET /api/qod -> Returns latest QOD from Firebase
 * POST /api/qod -> Triggers fetch from Arise API, saves to Firebase, returns QOD
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

const fallbackServiceAccount = {
  type: "service_account",
  project_id: "epaper-api-key",
  private_key_id: "14ee0d69d43049bbfd8b1e343f82c1e52c7f3df2",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEugIBADANBgkqhkiG9w0BAQEFAASCBKQwggSgAgEAAoIBAQC1W74awnpejMFU\nFUP89jS/nC3+ii8UvaCnZSNrSpoFUe6MEqIJgHwI3MbAqNJG4DSapCn3HDTwc82p\nYzjebMmTttByGGwNwFH6aE3/Z/Q4tbRRKCqhrGqzpWc8HG0QeYHOnTZtUMCLWIwV\niT7pI0/loxHg9zUTCzw2E6pRsN5fdKt2R1UXpBuMcL9BuxxV1Q//rNR3jJyZEmk8\nnJHVS/+1a5mVyxr4J3fUxkKKiOlVE6N3EKky9prCMAKXFsGAY+ybwxAngYjUbxlJ\ny+3q6THxq9Jt6afL67jnRCh2NR7Ws5K8XvvIHCYaTc1F3/bkZnu/JkmsldH/GBBz\nwK/AKxB1AgMBAAECgf9HbrCc2aeulheP3CXAp+PJlOUzh49ZHAJV7KrcF7DoEjK4\no/OEH+y65jq3/RwrI87pxL9tatlvMYL6tO+GrFK5W8hpKDVnNS5qSFXFw6xDVKPb\n/iDMjUd50CxZVi5Jzud8pMT19FiNNNNNqEFJ6B661FVhG/2hAqE0q4o/ouqeWIBd\nDsoePdCN7OQlb106GzMBNJQ29b2kDhzmnYnyIvlV5FRXp6RLY9q9xU4TAfrg0+fo\nAX+gPafrn6B9Npn7a7Y+4nl2tKm3LW9do+UDJWKMJUwtNqhGf5vz9++DTx30qyuu\nR63NoKrqq0Xpq14Lli8IUPp5AHmesahOm6P5bBECgYEA8UWzjAXu1xnqQhVvAi0k\n3tXPciUfiB6Wy2WF51l3dCl0HMv6ZzObxHwKTI/JGxMVmj7CkQxeyBinC+RN/0ya\nlrVRrmvYCcOSMWlyMzHlpf7aZILb5zUQE/m/gMTmM9zCw9xq3hCJy2o3UGFYGqEI\nkFsTZIQXySjjOpyfey6Yl60CgYEAwG3IShqD7jjKwLGax6iNQjsIVPwBtyG355QT\nbxatZYjsESOPlCksHaUBPQmcjB0+enNYfcsClb5n1q1EFelB3HWkcjKHvyj2whtm\nL4uifDlnnVaA2FA4muVIAXIP9pM9E2H7qmlb19MzM+ejf+WL4jPV720XWBP6lYU2\nftUdlOkCgYBL9L2Jn3SJk0cEdurzrHKnFHiyXq2GlNq0PcniA3BvyX0cc7rpMn4f\nZU14vOt68o8ieA+YymQsalZsj/teHCeuunZ0is8Ag+lKVP/2zgaWM51ddzTznOjq\n4P1A9LvkJ+PI9WNPdbVrrIytaXfrKjcf+wwn4M38LjsbAKPUi97OIQKBgA/8zwhB\nHbb8JvRNjUOLYHkhOHb/HRFfDs2Bwv+Wzb9C2gIuhy5TIWQxImI02znU8CzySmbh\nKAzS7gOrD54WbC9p4sjOI/Mg7yd/aUUH/+78QfyThE70k09jP1FHbcYZw5hJqsQk\nzsmmtXlZhH8Kzk1z6xFiae8acdZcZAOzpyqJAoGAOmJ+uItEj/MvQhf9QWn3ZslY\nA5IHWSgjQFWQ0x4n0XANTXFkdI2Lf2QjkfEX4kvMBXaXZmHfjo7pba1lPVaOE9p9\nioM79KcNF73gPz4gMoVXr5vtOyEqIlF6rJabj27RHz4zsAw/N74PQkwfQjLOmaTt\nc3LC6MH1cDgxVMkiQoQ=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@epaper-api-key.iam.gserviceaccount.com",
  client_id: "107570320592294042288"
};

function getDb() {
  if (!getApps().length) {
    try {
      let serviceAccount = {};
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      }
      if (!serviceAccount.project_id) {
        serviceAccount = fallbackServiceAccount;
      }
      initializeApp({ credential: cert(serviceAccount) });
    } catch (err) {
      console.error("Firebase Admin init error:", err);
      try {
        initializeApp({ credential: cert(fallbackServiceAccount) });
      } catch (e) {
        console.error("Fallback init error:", e);
      }
    }
  }
  return getFirestore();
}

async function fetchQodFromArise() {
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

  const qodRes = await fetch('https://api.arisemedicalacademy.com/instituteApp/library/getQuestionOfTheDay', {
    method: 'GET',
    headers: {
      ...commonHeaders,
      'Authorization': `Bearer ${token}`,
      "X-Request-Id": crypto.randomUUID()
    }
  });

  if (qodRes.status !== 200) {
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

  const db = getDb();
  await db.collection('qod').doc('latest').set(finalData);
  const today = new Date().toISOString().split('T')[0];
  await db.collection('qod').doc(today).set(finalData);

  return finalData;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST' || req.query.fetch === 'true') {
      const data = await fetchQodFromArise();
      return res.status(200).json({
        status: "success",
        message: "Question of the Day fetched and saved to Firebase",
        data: data
      });
    }

    // Default GET: retrieve from Firebase
    const db = getDb();
    const docSnap = await db.collection('qod').doc('latest').get();

    if (docSnap.exists) {
      return res.status(200).json({
        status: "success",
        provider: "Arise Medical Academy",
        data: docSnap.data()
      });
    } else {
      return res.status(404).json({
        status: "error",
        message: "No Question of the Day found in database"
      });
    }

  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
}
