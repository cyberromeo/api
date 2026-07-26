const axios = require('axios');

const CRONICLE_URL = process.env.CRONICLE_URL || 'http://umbrel.local:3012';
const CRONICLE_API_KEY = process.env.CRONICLE_API_KEY || 'ba768ce3fa7125fa071a5e2d62110bd7';

async function testMotraCron() {
  console.log("🧪 Triggering 'Motra Muscle Recovery Sync' (ems1n964g1f)...");
  try {
    const res = await axios.post(`${CRONICLE_URL}/api/app/run_event/v1?api_key=${CRONICLE_API_KEY}`, { id: "ems1n964g1f" });
    console.log("✅ Cronicle Response:", res.data);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testMotraCron();
