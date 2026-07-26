const fs = require('fs');

const harPath = 'c:/Users/psrih/Downloads/daily api/ProxyPin7-26_19_26_32.har';
const harData = JSON.parse(fs.readFileSync(harPath, 'utf8'));

const entries = harData.log.entries || [];

entries.forEach((entry, idx) => {
  const req = entry.request;
  if (req.url.includes('/user/muscle-recovery')) {
    console.log(`\n======================================== ENTRY #${idx + 1}`);
    console.log("URL:", req.url);
    console.log("METHOD:", req.method);
    console.log("HEADERS:");
    req.headers.forEach(h => console.log(`  ${h.name}: ${h.value}`));
    console.log("RESPONSE STATUS:", entry.response.status);
    console.log("RESPONSE HEADERS:");
    entry.response.headers.forEach(h => console.log(`  ${h.name}: ${h.value}`));
  }
});
