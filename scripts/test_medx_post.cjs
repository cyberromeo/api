const axios = require('axios');

async function resetTestItem() {
  await axios.post("https://medx.srihari.quest/api/tracker", {
    userId: "NpFFvozZSFWnCKdmutkISEGPf8o2",
    subject: "Anatomy",
    field: "Videos",
    value: false
  });
  console.log("Reset Anatomy Videos to false.");
}

resetTestItem();
