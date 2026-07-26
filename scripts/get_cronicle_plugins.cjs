const axios = require('axios');

const CRONICLE_URL = process.env.CRONICLE_URL || 'http://umbrel.local:3012';
const CRONICLE_API_KEY = process.env.CRONICLE_API_KEY || 'ba768ce3fa7125fa071a5e2d62110bd7';

async function getPlugins() {
  const url = `${CRONICLE_URL}/api/app/get_plugins/v1?api_key=${CRONICLE_API_KEY}`;
  try {
    const res = await axios.get(url);
    console.log("CRONICLE PLUGINS LIST:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Error fetching plugins:", err.message);
  }
}

getPlugins();
