/**
 * Cronicle Worker Script: Panasonic MirAIe AC Power Consumption Fetcher
 * Schedule: Runs every 15 minutes in Cronicle Docker
 * Target Firebase DB: epaper-api-key (Collection: 'api_feeds')
 */

const admin = require('firebase-admin');
const axios = require('axios');
const path = require('path');

// Configuration
const DEVICE_ID = process.env.MIRAIE_DEVICE_ID || '36ff8e5467b2';
const AUTH_TOKEN = process.env.MIRAIE_AUTH_TOKEN || 'Bearer 5627234a-129e-46be-b318-240d06871671';
const SERVICE_ACCOUNT_FILE = process.env.FIREBASE_SERVICE_ACCOUNT || './epaper-api-key-firebase-adminsdk-fbsvc-14ee0d69d4.json';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = require(path.resolve(process.cwd(), SERVICE_ACCOUNT_FILE));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("⚡ Firebase Admin initialized");
  } catch (err) {
    console.error("❌ Failed to load Firebase Service Account:", err.message);
    process.exit(1);
  }
}

const db = admin.firestore();

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

// API Request Headers
const HEADERS = {
  "Host": "app.miraie.in",
  "Content-Type": "application/json",
  "Accept": "*/*",
  "User-Agent": "MirAIe/1.4.10 (com.panasonic.in.miraie; build:16; iOS 27.0.0) Alamofire/5.11.2",
  "Accept-Language": "en-IN;q=1.0",
  "Authorization": AUTH_TOKEN,
  "Accept-Encoding": "application/json"
};

async function fetchAcPowerData() {
  const now = new Date();
  
  // Calculate dynamic date ranges
  const todayDDMMYYYY = formatDDMMYYYY(now);
  
  // 7 days ago for Daily trend & Today calculation
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 6);
  const sevenDaysAgoDDMMYYYY = formatDDMMYYYY(sevenDaysAgo);

  // 4 weeks ago for Weekly trend
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(now.getDate() - 28);
  const fourWeeksAgoDDMMYYYY = formatDDMMYYYY(fourWeeksAgo);

  // Current year start month & end month
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

    // Extract Today's Usage (last entry in daily array or matching today)
    const todayRecord = dailyData.length > 0 ? dailyData[dailyData.length - 1] : null;
    const todayKwh = todayRecord ? (todayRecord.totalEnergyKwh || todayRecord.energyKwh || todayRecord.value || 0) : 0;

    // Extract This Week's Usage
    const thisWeekRecord = weeklyData.length > 0 ? weeklyData[weeklyData.length - 1] : null;
    const thisWeekKwh = thisWeekRecord ? (thisWeekRecord.totalEnergyKwh || thisWeekRecord.energyKwh || thisWeekRecord.value || 0) : 0;

    // Extract This Month's Usage
    const thisMonthRecord = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : null;
    const thisMonthKwh = thisMonthRecord ? (thisMonthRecord.totalEnergyKwh || thisMonthRecord.energyKwh || thisMonthRecord.value || 0) : 0;

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
    console.log(`   - Today: ${payload.summary.todayKwh} kWh`);
    console.log(`   - This Week: ${payload.summary.thisWeekKwh} kWh`);
    console.log(`   - This Month: ${payload.summary.thisMonthKwh} kWh`);

    // Write / Update in Firestore 'api_feeds' collection
    const docRef = await db.collection('api_feeds').add({
      apiName: 'AC_POWER',
      source: 'MirAIe Panasonic AC API',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'success',
      payload: payload
    });

    console.log(`✅ Successfully written to Firebase! Document ID: ${docRef.id}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ MirAIe API Request Error:", error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

fetchAcPowerData();
