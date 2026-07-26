const fs = require('fs');

const harPath = 'c:/Users/psrih/Downloads/daily api/ProxyPin7-26_19_26_32.har';
const harData = JSON.parse(fs.readFileSync(harPath, 'utf8'));

const entries = harData.log.entries || [];

entries.forEach(entry => {
  const req = entry.request;
  const res = entry.response;
  
  if (req.url.includes('motra.com')) {
    console.log(`\n========================================`);
    console.log(`[${res.status}] ${req.method} ${req.url}`);
    if (res.content && res.content.text) {
      try {
        const json = JSON.parse(res.content.text);
        console.log("RESPONSE DATA:", JSON.stringify(json, null, 2).substring(0, 500) + "...");
      } catch (e) {
        console.log("RESPONSE TEXT:", res.content.text.substring(0, 200));
      }
    }
  }
});
