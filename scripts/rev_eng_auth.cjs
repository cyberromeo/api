/**
 * Reverse engineer Motra (Train) Firebase Auth flow
 * 
 * Motra uses Firebase project "train-165d3" with Google Sign-In.
 * Firebase ID tokens expire every 60 minutes.
 * To auto-refresh, we need:
 *   1. The Firebase Web API Key for project "train-165d3"
 *   2. A Firebase Refresh Token (never expires unless revoked)
 * 
 * The refresh token endpoint is:
 *   POST https://securetoken.googleapis.com/v1/token?key=<API_KEY>
 *   Body: grant_type=refresh_token&refresh_token=<REFRESH_TOKEN>
 * 
 * Step 1: Try to find the API key from public Firebase hosting config
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function findFirebaseConfig() {
  // Firebase projects often expose their config at well-known URLs
  // The project ID is "train-165d3" - check common Firebase hosting paths
  
  const urls = [
    'https://train-165d3.web.app/__/firebase/init.json',
    'https://train-165d3.firebaseapp.com/__/firebase/init.json',
  ];
  
  for (const url of urls) {
    console.log(`🔍 Trying: ${url}`);
    try {
      const res = await fetch(url, { timeout: 5000 });
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ Found Firebase config at ${url}:`);
        console.log(JSON.stringify(data, null, 2));
        return data;
      } else {
        console.log(`   ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      console.log(`   Error: ${err.message}`);
    }
  }
  
  return null;
}

findFirebaseConfig().then(config => {
  if (config && config.apiKey) {
    console.log(`\n🔑 Firebase Web API Key: ${config.apiKey}`);
    console.log(`\nNow you need a refresh token. The Motra iOS app stores it locally.`);
    console.log(`To get it, capture a POST to securetoken.googleapis.com in ProxyPin.`);
  } else {
    console.log(`\n⚠️ Could not find Firebase config via hosting. Trying alternative...`);
  }
});
