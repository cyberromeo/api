const axios = require('axios');

const CRONICLE_URL = process.env.CRONICLE_URL || 'http://umbrel.local:3012';
const CRONICLE_API_KEY = process.env.CRONICLE_API_KEY || 'ba768ce3fa7125fa071a5e2d62110bd7';

async function cleanupDuplicates() {
  const duplicates = ['ems1h0hs50d', 'ems1j7ot90r'];
  for (const id of duplicates) {
    try {
      console.log(`Deleting duplicate event '${id}'...`);
      const res = await axios.post(`${CRONICLE_URL}/api/app/delete_event/v1?api_key=${CRONICLE_API_KEY}`, { id });
      console.log(`Result for ${id}:`, res.data);
    } catch (err) {
      console.warn(`Warning for ${id}:`, err.message);
    }
  }
}

cleanupDuplicates();
