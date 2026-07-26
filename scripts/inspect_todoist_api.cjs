const axios = require('axios');

const TODOIST_TOKEN = '1a3f2d0c74b55c9503e88a2b5c6221485fc32c1b';

async function testTodoistFetch() {
  console.log("📡 Fetching active tasks from Todoist /api/v1/tasks...");
  
  try {
    const res = await axios.get("https://api.todoist.com/api/v1/tasks", {
      headers: {
        "Authorization": `Bearer ${TODOIST_TOKEN}`
      }
    });

    console.log("STATUS v1:", res.status);
    console.log("RESPONSE DATA TYPE:", typeof res.data);
    console.log("RESPONSE KEYS:", Object.keys(res.data));
    console.log("FULL JSON DATA:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Error:", err.response ? err.response.status + " " + JSON.stringify(err.response.data) : err.message);
  }
}

testTodoistFetch();
