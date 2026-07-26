const axios = require('axios');

const CRONICLE_URL = process.env.CRONICLE_URL || 'http://umbrel.local:3012';
const CRONICLE_API_KEY = process.env.CRONICLE_API_KEY || 'ba768ce3fa7125fa071a5e2d62110bd7';

async function testTrigger() {
  console.log("🧪 Triggering 'MedX Study Time Sync' (ems1j7ot90r)...");
  try {
    const res1 = await axios.post(`${CRONICLE_URL}/api/app/run_event/v1?api_key=${CRONICLE_API_KEY}`, { id: "ems1j7ot90r" });
    console.log("✅ Study Time Trigger Result:", res1.data);
  } catch (err) {
    console.error("Study Time Error:", err.message);
  }

  console.log("\n🧪 Triggering 'MedX Tracker Sync' (ems1irisu0l)...");
  try {
    const res2 = await axios.post(`${CRONICLE_URL}/api/app/run_event/v1?api_key=${CRONICLE_API_KEY}`, { id: "ems1irisu0l" });
    console.log("✅ Tracker Trigger Result:", res2.data);
  } catch (err) {
    console.error("Tracker Error:", err.message);
  }
}

testTrigger();
