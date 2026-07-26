const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const HAR_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2ZWUwMzFlODZhM2YwZmNkOWI2ZDcwMDJiMDJiMDg2ZDJmNTVkZTQiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiU1JJSEFSSSBQUkFCQUtBUkFOIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0pnMWR3LV9SbGZLbG4zLUhTM21UbUJDTHFiVU11OVRuRW8wNENZcWtCc3pfQkQydEk0PXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3RyYWluLTE6NWQzIiwiYXVkIjoidHJhaW4tMTY1ZDMiLCJhdXRoX3RpbWUiOjE3NzgyMjk4MzAsInVzZXJfaWQiOiI3dTRHTFRrV2ZJTXBqSjhHd2pUYXlyNTJLa2IyIiwic3ViIjoiN3U0R0xUa1dmSU1wako4R3dqVGF5cjUyS2tiMiIsImlhdCI6MTc4NTA3MjcxMywiZXhwIjoxNzg1MDc2MzEzLCJlbWFpbCI6InBzcmloYXJpMjM4QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImFwcGxlLmNvbSI6WyIwMDA0ODguNzcwNDU1NTAyYjk4NGY1OWEyYjhiOWUwYzI0MDdmMTMuMDAwNiJdLCJnb29nbGUuY29tIjpbIjEwNzA0MDkyNzY4MjA3NTU0NDY4OSJdLCJlbWFpbCI6WyJwc3JpaGFyaTIzOEBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.dTuuPhg8JxuIzZ5lwqhA6QSsCBw47EHlbkZTOx_hPiwh_ngouz4LR5jEB0lCunFzzvVV0q9e5P79KGFZYpPG3E6vlQWRvWAbzcFNC9Cme4USKUvnQgoriD_lWKtwmn568a0Ldzac3Szs8ZTIsqdQbLf_tiGG4yvDcyqskHkctFNJle9GHWLGrUtWopUVn7yQv2LoIkx5_mIEuiTJtM7zxYL7NE0pUXJl33XbpqrBe3N0TRON1p3nGBwEHPGUf0o2iDXfMTSsNF_lN1-LcJUW2Kf6RW4ks1BRQ1444cuAZKrMMS66Cr7qAjvkus-I-cN5AfNn87gelDBMbj_DNQtsMg";

// Fix typo: replace MDg6 with MDg2
const FIXED_TOKEN = HAR_TOKEN.replace("MDg6", "MDg2");

async function testMotra() {
  console.log("📡 Fetching Motra API directly with FIXED HAR TOKEN...");
  const res = await fetch("https://backend.motra.com/user/muscle-recovery", {
    headers: {
      "Host": "backend.motra.com",
      "Content-Type": "application/json",
      "Accept": "*/*",
      "User-Agent": "Motra/1 CFNetwork/3892.100.1 Darwin/27.0.0",
      "Authorization": `Bearer ${FIXED_TOKEN}`,
      "Accept-Language": "en-IN,en;q=0.9"
    }
  });

  console.log("Status Code:", res.status);
  const text = await res.text();
  console.log("Response Body:\n", text);
}

testMotra();
