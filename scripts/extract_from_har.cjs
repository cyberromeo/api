const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function extractAndSyncMotra() {
  const projectDir = 'c:/Users/psrih/Downloads/daily api';
  const files = fs.readdirSync(projectDir);
  const harFiles = files.filter(f => f.endsWith('.har'));

  console.log(`🔍 Found ${harFiles.length} HAR file(s):`, harFiles);

  let latestToken = null;
  let latestTime = 0;

  harFiles.forEach(file => {
    try {
      const harContent = fs.readFileSync(path.join(projectDir, file), 'utf8');
      const harData = JSON.parse(harContent);
      const entries = harData.log?.entries || [];

      entries.forEach(entry => {
        const req = entry.request;
        if (req && req.url && req.url.includes('motra.com')) {
          const authHeader = req.headers.find(h => h.name.toLowerCase() === 'authorization');
          if (authHeader && authHeader.value && authHeader.value.startsWith('Bearer ')) {
            const token = authHeader.value.replace('Bearer ', '').trim();
            // Parse JWT exp time
            try {
              const parts = token.split('.');
              if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                if (payload.exp && payload.exp > latestTime) {
                  latestTime = payload.exp;
                  latestToken = token;
                }
              }
            } catch (e) {}
          }
        }
      });
    } catch (err) {
      console.warn(`Error reading ${file}:`, err.message);
    }
  });

  if (!latestToken) {
    console.error("❌ No valid Motra Bearer token found in HAR files.");
    process.exit(1);
  }

  const expDate = new Date(latestTime * 1000);
  console.log(`✅ Extracted Latest Motra Token from HAR!`);
  console.log(`   - Expires at: ${expDate.toLocaleString()} (Unix: ${latestTime})`);
  console.log(`   - Is Currently Valid: ${Date.now() < latestTime * 1000}`);

  console.log("\n📡 Testing Motra Muscle Recovery Fetch with Extracted Token...");
  try {
    const res = await axios.get("https://backend.motra.com/user/muscle-recovery", {
      headers: {
        "Host": "backend.motra.com",
        "Content-Type": "application/json",
        "Accept": "*/*",
        "User-Agent": "Motra/1 CFNetwork/3892.100.1 Darwin/27.0.0",
        "Authorization": `Bearer ${latestToken}`,
        "Accept-Language": "en-IN,en;q=0.9"
      }
    });

    console.log("✅ Motra API Response Status:", res.status);
    console.log("📊 Response Data Summary:", res.data?.data?.recoveredMuscles ? `${res.data.data.recoveredMuscles}/18 Recovered` : "Success");
    const muscles = res.data?.data?.musclesRecoveryStats || [];
    console.log(`💪 Total Muscles Returned: ${muscles.length}`);
    muscles.slice(0, 5).forEach(m => {
      console.log(`   • ${m.muscle}: ${m.recovery}% recovery (${m.daysToRecovery} days to full recovery)`);
    });
  } catch (err) {
    console.error("❌ Fetch Error:", err.response ? err.response.status + " " + JSON.stringify(err.response.data) : err.message);
  }
}

extractAndSyncMotra();
