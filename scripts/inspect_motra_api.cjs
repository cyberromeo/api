/**
 * Inspector for Motra Muscle Recovery API
 * Endpoint: https://backend.motra.com/user/muscle-recovery
 */

const axios = require('axios');

const MOTRA_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2ZWUwMzFlODZhM2YwZmNkOWI2ZDcwMDJiMDJiMDg2ZDJmNTVkZTQiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiU1JJSEFSSSBQUkFCQUtBUkFOIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0pnMWR3LV9SbGZLbG4zLUhTM21UbUJDTHFiVU11OVRuRW8wNENZcWtCc3pfQkQydEk0PXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3RyYWluLTE2NWQzIiwiYXVkIjoidHJhaW4tMTY1ZDMiLCJhdXRoX3RpbWUiOjE3NzgyMjk4MzAsInVzZXJfaWQiOiI3dTRHTFRrV2ZJTXBqSjhHd2pUYXlyNTJLa2IyIiwic3ViIjoiN3U0R0xUa1dmSU1wako4R3dqVGF5cjUyS2tiMiIsImlhdCI6MTc4NTA2MDI3MiwiZXhwIjoxNzg1MDYzODcyLCJlbWFpbCI6InBzcmloYXJpMjM4QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImFwcGxlLmNvbSI6WyIwMDA0ODguNzcwNDU1NTAyYjk4NGY1OWEyYjhiOWUwYzI0MDdmMTMuMDAwNiJdLCJnb29nbGUuY29tIjpbIjEwNzA0MDkyNzY4MjA3NTU0NDY4OSJdLCJlbWFpbCI6WyJwc3JpaGFyaTIzOEBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.AcN0NHMkfG1IUD4mgXlMO-ASgUzHjgK4Iebg-qipAM6P_elwVN37jpNUJV0zihwjY41GaNg7LXuYy5BOwWEAxRSbSY2URuEPxsVZK4FvmzRQKyLR46JhgZRdGNZPKrp_93U_zNudD49oL_ObLDwnnxG7vl44dCmHhHtjya2pSRFjka2gbgLe77mNxvOZOHoKcfjdKpC7JmXxIxr48aq-nQXMRmHYzQMNrl1orTFVzo9VtNi9sKIRwuxoKyE1xm0RoaVVnBrwHKHPZw5d7lXdQhlzVTl3Yad845leOuWP2I00er5gtoZZRVGFTNVfNRPH6fnI_ReZ963D8wQ1fSDa3w";

async function fetchMotraData() {
  console.log("📡 Fetching Motra Muscle Recovery Telemetry...");

  try {
    const res = await axios.get("https://backend.motra.com/user/muscle-recovery", {
      headers: {
        "Host": "backend.motra.com",
        "Content-Type": "application/json",
        "Accept": "*/*",
        "User-Agent": "Motra/1 CFNetwork/3892.100.1 Darwin/27.0.0",
        "Authorization": `Bearer ${MOTRA_TOKEN}`,
        "Accept-Language": "en-IN,en;q=0.9"
      }
    });

    console.log("✅ Motra API Response Status:", res.status);
    console.log("FULL JSON PAYLOAD:\n", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("❌ Motra API Error:", err.response ? err.response.status + " " + JSON.stringify(err.response.data) : err.message);
  }
}

fetchMotraData();
