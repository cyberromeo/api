const axios = require('axios');

const CRONICLE_URL = process.env.CRONICLE_URL || 'http://umbrel.local:3012';
const CRONICLE_API_KEY = process.env.CRONICLE_API_KEY || 'ba768ce3fa7125fa071a5e2d62110bd7';

async function listEvents() {
  try {
    const res = await axios.get(`${CRONICLE_URL}/api/app/get_schedule/v1?api_key=${CRONICLE_API_KEY}`);
    const events = res.data.rows || res.data.events || [];
    console.log(`📋 Total Cronicle Events Found: ${events.length}\n`);
    events.forEach(e => {
      console.log(`  - [ID: ${e.id}] "${e.title}" | Enabled: ${e.enabled}`);
    });
  } catch (err) {
    console.error("Cronicle Error:", err.response ? err.response.data : err.message);
  }
}

listEvents();
