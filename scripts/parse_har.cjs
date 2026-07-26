const fs = require('fs');

const harPath = 'c:/Users/psrih/Downloads/daily api/ProxyPin7-26_19_26_32.har';
const harData = JSON.parse(fs.readFileSync(harPath, 'utf8'));

const entries = harData.log.entries || [];

console.log(`Found ${entries.length} HAR entries.\n`);

const tokens = new Set();
const motraRequests = [];

entries.forEach(entry => {
  const req = entry.request;
  const url = req.url;
  
  if (url.includes('motra.com')) {
    const authHeader = req.headers.find(h => h.name.toLowerCase() === 'authorization');
    if (authHeader && authHeader.value) {
      tokens.add(authHeader.value);
    }
    motraRequests.push({
      method: req.method,
      url: url,
      status: entry.response.status,
      token: authHeader ? authHeader.value.substring(0, 40) + '...' : 'none'
    });
  }
});

console.log("Found Motra Authorization Tokens:");
tokens.forEach(t => console.log(t));

console.log("\nMotra Requests Logged in HAR:");
motraRequests.forEach(r => console.log(`[${r.status}] ${r.method} ${r.url}`));
