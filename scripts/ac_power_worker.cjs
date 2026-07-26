/**
 * Cronicle Worker Script: Panasonic MirAIe AC Power Consumption Fetcher
 * Target Firebase DB: epaper-api-key
 * Collection: 'api_feeds' -> Fixed Document: 'ac_power_metrics'
 * Schedule: Runs every 20 minutes from 6 AM to 12 AM midnight via Cronicle
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const axios = require('axios');
const path = require('path');

// Configuration
const DEVICE_ID = process.env.MIRAIE_DEVICE_ID || '36ff8e5467b2';
const AUTH_TOKEN = process.env.MIRAIE_AUTH_TOKEN || 'Bearer 5627234a-129e-46be-b318-240d06871671';
const SERVICE_ACCOUNT_FILE = process.env.FIREBASE_SERVICE_ACCOUNT || '../epaper-api-key-firebase-adminsdk-fbsvc-14ee0d69d4.json';

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    const serviceAccountPath = path.resolve(__dirname, SERVICE_ACCOUNT_FILE);
    const serviceAccount = require(serviceAccountPath);
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log("⚡ Firebase Admin initialized");
  } catch (err) {
    console.error("❌ Failed to load Firebase Service Account:", err.message);
    process.exit(1);
  }
}

const db = getFirestore();

// Helper: Format Date to DDMMYYYY
function formatDDMMYYYY(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}${mm}${yyyy}`;
}

// Helper: Format Date to MMYYYY
function formatMMYYYY(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}${yyyy}`;
}

// Headers for Panasonic MirAIe API
const HEADERS = {
  "Host": "app.miraie.in",
  "Content-Type": "application/json",
  "Connection": "keep-alive",
  "Accept": "*/*",
  "User-Agent": "MirAIe/1.4.10 (com.panasonic.in.miraie; build:16; iOS 27.0.0) Alamofire/5.11.2",
  "Accept-Language": "en-IN;q=1.0",
  "Authorization": AUTH_TOKEN,
  "Accept-Encoding": "application/json"
};

async function fetchAcPowerData() {
  const now = new Date();
  
  // Calculate dynamic date ranges for Today, Week, and Month
  const todayDDMMYYYY = formatDDMMYYYY(now);
  
  // 7 days window for Daily grain
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 6);
  const sevenDaysAgoDDMMYYYY = formatDDMMYYYY(sevenDaysAgo);

  // 4 weeks window for Weekly grain
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(now.getDate() - 28);
  const fourWeeksAgoDDMMYYYY = formatDDMMYYYY(fourWeeksAgo);

  // Start of current year to current month for Monthly grain
  const startMonthMMYYYY = `01${now.getFullYear()}`;
  const endMonthMMYYYY = formatMMYYYY(now);

  console.log(`📡 Fetching AC Power metrics for Device: ${DEVICE_ID}...`);

  try {
    // 1. Fetch Daily Grain
    const dailyUrl = `https://app.miraie.in/simplifi/v1/powerConsumption/devices/${DEVICE_ID}?grain=Daily&startDate=${sevenDaysAgoDDMMYYYY}&endDate=${todayDDMMYYYY}`;
    const dailyRes = await axios.get(dailyUrl, { headers: HEADERS });
    
    // 2. Fetch Weekly Grain
    const weeklyUrl = `https://app.miraie.in/simplifi/v1/powerConsumption/devices/${DEVICE_ID}?grain=Weekly&startDate=${fourWeeksAgoDDMMYYYY}&endDate=${todayDDMMYYYY}`;
    const weeklyRes = await axios.get(weeklyUrl, { headers: HEADERS });

    // 3. Fetch Monthly Grain
    const monthlyUrl = `https://app.miraie.in/simplifi/v1/powerConsumption/devices/${DEVICE_ID}?grain=Monthly&startDate=${startMonthMMYYYY}&endDate=${endMonthMMYYYY}`;
    const monthlyRes = await axios.get(monthlyUrl, { headers: HEADERS });

    const dailyData = dailyRes.data || [];
    const weeklyData = weeklyRes.data || [];
    const monthlyData = monthlyRes.data || [];

    // Extract Today's Usage (.power key)
    const todayRecord = Array.isArray(dailyData) && dailyData.length > 0 ? dailyData[dailyData.length - 1] : dailyData;
    const todayKwh = todayRecord ? (todayRecord.power ?? 0) : 0;

    // Extract This Week's Usage (.power key)
    const thisWeekRecord = Array.isArray(weeklyData) && weeklyData.length > 0 ? weeklyData[weeklyData.length - 1] : weeklyData;
    const thisWeekKwh = thisWeekRecord ? (thisWeekRecord.power ?? 0) : 0;

    // Extract This Month's Usage (.power key)
    const thisMonthRecord = Array.isArray(monthlyData) && monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : monthlyData;
    const thisMonthKwh = thisMonthRecord ? (thisMonthRecord.power ?? 0) : 0;

    const payload = {
      deviceId: DEVICE_ID,
      lastUpdated: now.toISOString(),
      summary: {
        todayKwh: parseFloat(Number(todayKwh).toFixed(2)),
        thisWeekKwh: parseFloat(Number(thisWeekKwh).toFixed(2)),
        thisMonthKwh: parseFloat(Number(thisMonthKwh).toFixed(2)),
        unit: 'kWh'
      },
      raw: {
        daily: dailyData,
        weekly: weeklyData,
        monthly: monthlyData
      }
    };

    console.log("📊 Aggregated AC Power Usage Summary:");
    console.log(`   - Today (${todayRecord?.day || 'Today'}): ${payload.summary.todayKwh} kWh`);
    console.log(`   - This Week: ${payload.summary.thisWeekKwh} kWh`);
    console.log(`   - This Month (${thisMonthRecord?.month || 'This Month'}): ${payload.summary.thisMonthKwh} kWh`);

    // OVERWRITE/UPDATE the SAME canonical document 'ac_power_metrics' in Firestore
    await db.collection('api_feeds').doc('ac_power_metrics').set({
      apiName: 'AC_POWER',
      source: 'MirAIe Panasonic AC API',
      timestamp: FieldValue.serverTimestamp(),
      status: 'success',
      payload: payload
    }, { merge: true });

    console.log("✅ Successfully updated canonical Firestore document: 'api_feeds/ac_power_metrics'");
    process.exit(0);
  } catch (error) {
    console.error("❌ MirAIe API Request Error:", error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

fetchAcPowerData();
