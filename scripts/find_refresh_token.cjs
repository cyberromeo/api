const fs = require('fs');

const harPath = 'c:/Users/psrih/Downloads/daily api/ProxyPin7-26_19_26_32.har';
const harContent = fs.readFileSync(harPath, 'utf8');
const harData = JSON.parse(harContent);
const entries = harData.log.entries || [];

console.log("=== Searching for token exchange / refresh flows ===\n");

// Look for ALL googleapis domains
entries.forEach((entry, idx) => {
  const url = entry.request.url;
  if (url.includes('googleapis.com') || url.includes('securetoken') || url.includes('identitytoolkit')) {
    console.log(`Entry #${idx}: [${entry.response.status}] ${entry.request.method} ${url}`);
    if (entry.request.postData?.text) {
      console.log(`  POST body: ${entry.request.postData.text.substring(0, 300)}`);
    }
    if (entry.response.content?.text) {
      console.log(`  Response: ${entry.response.content.text.substring(0, 300)}`);
    }
    console.log();
  }
});

// Also look for any request that has a field "refreshToken" or "refresh_token" in body
console.log("=== Searching ALL POST bodies for refresh token patterns ===\n");
entries.forEach((entry, idx) => {
  const postText = entry.request.postData?.text || '';
  const respText = entry.response.content?.text || '';
  
  if (postText.includes('refresh') || respText.includes('refresh') ||
      postText.includes('grant_type') || respText.includes('grant_type')) {
    console.log(`Entry #${idx}: [${entry.response.status}] ${entry.request.method} ${entry.request.url}`);
    if (postText) console.log(`  POST: ${postText.substring(0, 200)}`);
    if (respText) console.log(`  RESP: ${respText.substring(0, 200)}`);
    console.log();
  }
});

// Search for revenuecat - it sometimes embeds Firebase tokens
console.log("=== RevenueCat entries (may contain Firebase auth) ===\n");
entries.forEach((entry, idx) => {
  if (entry.request.url.includes('revenuecat')) {
    console.log(`Entry #${idx}: [${entry.response.status}] ${entry.request.method} ${entry.request.url}`);
    const authH = entry.request.headers.find(h => h.name.toLowerCase() === 'authorization');
    if (authH) console.log(`  Auth: ${authH.value.substring(0, 60)}...`);
    const respText = entry.response.content?.text || '';
    if (respText && respText.length < 500) console.log(`  Resp: ${respText}`);
    console.log();
  }
});
