/**
 * Detailed Inspector for MirAIe Weekly Grain API
 */

const axios = require('axios');

const DEVICE_ID = '36ff8e5467b2';
const AUTH_TOKEN = 'Bearer 5627234a-129e-46be-b318-240d06871671';

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

async function inspectWeeklyApi() {
  console.log("🔍 Inspecting MirAIe Weekly Grain API for Device:", DEVICE_ID);

  // 1. User sample date range: 24/05/2026 to 26/07/2026
  const url1 = `https://app.miraie.in/simplifi/v1/powerConsumption/devices/${DEVICE_ID}?grain=Weekly&startDate=24052026&endDate=26072026`;
  
  try {
    const res = await axios.get(url1, { headers: HEADERS });
    const data = res.data;

    console.log("\n📊 Weekly Response Structure:");
    console.log("Total Weeks Returned:", Array.isArray(data) ? data.length : 1);
    console.log("\nBreakdown of Weekly Data:");
    
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        console.log(`  Week #${index + 1}: Date/Week End = ${item.week || item.date || item.day} -> Power Consumed = ${Number(item.power).toFixed(2)} kWh`);
      });
    } else {
      console.log(data);
    }
  } catch (err) {
    console.error("Error calling Weekly API:", err.response ? err.response.data : err.message);
  }
}

inspectWeeklyApi();
