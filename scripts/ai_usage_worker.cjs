/**
 * Cronicle Worker Script: OpenCode AI Usage Metrics Fetcher
 * Schedule: Runs every 15 minutes in Cronicle Docker
 * Target Firebase DB: epaper-api-key
 * Collection: 'api_feeds' -> Fixed Document: 'ai_usage_metrics'
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const axios = require('axios');
const path = require('path');

const SERVICE_ACCOUNT_FILE = process.env.FIREBASE_SERVICE_ACCOUNT || '../epaper-api-key-firebase-adminsdk-fbsvc-14ee0d69d4.json';

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    const serviceAccountPath = path.resolve(__dirname, SERVICE_ACCOUNT_FILE);
    const serviceAccount = require(serviceAccountPath);
    initializeApp({ credential: cert(serviceAccount) });
    console.log("⚡ Firebase Admin initialized");
  } catch (err) {
    console.error("❌ Failed to load Firebase Service Account:", err.message);
    process.exit(1);
  }
}

const db = getFirestore();

const WORKSPACE_URL = process.env.OPENCODE_WORKSPACE_URL || "https://opencode.ai/workspace/wrk_01KWYHQ06WTW00CA0RFP7AK07Q/go";
const COOKIE = process.env.OPENCODE_COOKIE || "ext_name=98B976E3G5; auth=Fe26.2**5c4e58cbb87e1a05432606c6475c01df150b6529c2c899685d144470b3472fb5*UiO8lkkP_TsACQVY2JEh0g*6A6vZGC-H3VZXyKewl6n9qY0e43bkEg3ts8HRrWpaOQfrCIyCYq4emxTfO7haUxNE_heiQy5mCuTcx2V4UhgeLgyLisGtuXK5vnzatMVC7O26ce_II1GCdFkt7wqmlE9XOPp8IhAF55fXSeyfjl4L2kBmUlzc6NncNpTsSz_cf1YOyG_Xpn_FJTxRLCM-XNKMYrl5qYL8WwAYVkK3hzBWXRCw4SrkKPKhh7gVA04DV0MzV8UieKT_Zt59bHrHTsDDTakC_BsmTxKPnElxZmRelpYnLbWEWpiFulj4YaFfkiAHHEau5HQZcnkoAbtM2zjB6HSSQLh0-Oa4NMEZ0qnbQ*1815995064814*27a8f7f129c64a04949d1a4245c182ed4b514c288cc87a5b67609e3c9f6d2c55*pjeXaqM9_bQI3daohjmi60ukKlIhCwzqKE-nCK77mVY; desktop_promo_dismissed=1; oc_locale=en";

const HEADERS = {
  "Host": "opencode.ai",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1",
  "Cookie": COOKIE,
  "Connection": "keep-alive"
};

function parseUsageSection(html) {
  const result = {
    rolling: { label: "Rolling Usage (5h)", percentage: 0, resetIn: "N/A" },
    weekly: { label: "Weekly Usage", percentage: 0, resetIn: "N/A" },
    monthly: { label: "Monthly Usage", percentage: 0, resetIn: "N/A" }
  };

  try {
    // Match each usage-item block
    const items = html.split('data-slot="usage-item"');
    items.forEach(item => {
      if (item.includes('Rolling Usage')) {
        const valMatch = item.match(/usage-value">\s*<!--\$-->(\d+)<!--\/-->%/);
        const resetMatch = item.match(/reset-time">\s*<!--\$-->Resets in<!--\/-->\s*<!--\$-->([\s\S]*?)<!--\/-->/);
        if (valMatch) result.rolling.percentage = parseInt(valMatch[1], 10);
        if (resetMatch) result.rolling.resetIn = resetMatch[1].replace(/<!--\/-->/g, '').trim();
      } else if (item.includes('Weekly Usage')) {
        const valMatch = item.match(/usage-value">\s*<!--\$-->(\d+)<!--\/-->%/);
        const resetMatch = item.match(/reset-time">\s*<!--\$-->Resets in<!--\/-->\s*<!--\$-->([\s\S]*?)<!--\/-->/);
        if (valMatch) result.weekly.percentage = parseInt(valMatch[1], 10);
        if (resetMatch) result.weekly.resetIn = resetMatch[1].replace(/<!--\/-->/g, '').trim();
      } else if (item.includes('Monthly Usage')) {
        const valMatch = item.match(/usage-value">\s*<!--\$-->(\d+)<!--\/-->%/);
        const resetMatch = item.match(/reset-time">\s*<!--\$-->Resets in<!--\/-->\s*<!--\$-->([\s\S]*?)<!--\/-->/);
        if (valMatch) result.monthly.percentage = parseInt(valMatch[1], 10);
        if (resetMatch) result.monthly.resetIn = resetMatch[1].replace(/<!--\/-->/g, '').trim();
      }
    });
  } catch (err) {
    console.error("HTML parse warning:", err.message);
  }

  return result;
}

async function fetchAiUsageData() {
  const now = new Date();
  console.log("📡 Fetching OpenCode AI Usage Telemetry...");

  try {
    const response = await axios.get(WORKSPACE_URL, { headers: HEADERS });
    const html = response.data;
    
    const usageData = parseUsageSection(html);

    console.log("📊 Parsed OpenCode AI Usage Limits:");
    console.log(`   - Rolling (5h): ${usageData.rolling.percentage}% (Resets in ${usageData.rolling.resetIn})`);
    console.log(`   - Weekly: ${usageData.weekly.percentage}% (Resets in ${usageData.weekly.resetIn})`);
    console.log(`   - Monthly: ${usageData.monthly.percentage}% (Resets in ${usageData.monthly.resetIn})`);

    const payload = {
      provider: "OpenCode AI Go",
      lastUpdated: now.toISOString(),
      summary: usageData
    };

    // OVERWRITE/UPDATE canonical document 'ai_usage_metrics' in Firestore
    await db.collection('api_feeds').doc('ai_usage_metrics').set({
      apiName: 'AI_USAGE',
      source: 'OpenCode AI Workspace API',
      timestamp: FieldValue.serverTimestamp(),
      status: 'success',
      payload: payload
    }, { merge: true });

    console.log("✅ Successfully updated canonical Firestore document: 'api_feeds/ai_usage_metrics'");
    process.exit(0);
  } catch (error) {
    console.error("❌ OpenCode API Request Error:", error.response ? error.response.status + " " + error.response.statusText : error.message);
    process.exit(1);
  }
}

fetchAiUsageData();
