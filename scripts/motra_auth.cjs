/**
 * Motra Auth - Complete Reverse Engineered Token Refresh Flow
 * 
 * Architecture discovered:
 *   Firebase Project: train-165d3
 *   API Key: AIzaSyC-DZbo61tN9YonKCtt_8UKg8YhejWsLNA
 *   Auth: Google Sign-In → Firebase Auth → ID Token (60min) + Refresh Token (persistent)
 *   Backend: backend.motra.com validates the Firebase ID token
 * 
 * The iOS app calls:
 *   POST https://securetoken.googleapis.com/v1/token?key=AIzaSyC-DZbo61tN9YonKCtt_8UKg8YhejWsLNA
 *   grant_type=refresh_token&refresh_token=<REFRESH_TOKEN>
 * 
 * This returns a fresh id_token (valid 60 min) + same refresh_token.
 * 
 * To get the initial refresh token, we sign in using the Google OAuth flow
 * via Firebase's REST Identity Toolkit.
 * 
 * Flow:
 *   1. Sign in to Google → get Google OAuth ID token
 *   2. Exchange Google ID token for Firebase credentials (includes refresh_token)
 *   3. Use refresh_token to mint fresh ID tokens forever
 *
 * Since we already have a valid (but expiring) Firebase ID token from the HAR,
 * we can use an alternative: the Firebase Auth REST API "lookup" to get account info,
 * but that doesn't give us a refresh token.
 *
 * The REAL solution: Sign in with Google programmatically.
 * Firebase REST API: POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=API_KEY
 *   with the Google OAuth token.
 *
 * But we need Google OAuth credentials first. Let's try another approach:
 * Use the Firebase Auth Emulator approach with signInWithEmailLink or
 * use Firebase Admin SDK to create a custom token, then exchange it.
 *
 * Actually the simplest: We can use Firebase Admin SDK (from our own project or 
 * cross-project) to create a custom token for uid "7u4GLTkWfIMpjJ8GwjTayr52Kkb2",
 * BUT custom tokens only work within the same project.
 *
 * BEST APPROACH: Sign in with email/password via REST API.
 * But the user uses Google Sign-In, not email/password.
 *
 * THE REAL PLAY: We need the user's Google OAuth refresh token.
 * The Motra app gets this from iOS Keychain. We can replicate by doing a 
 * programmatic Google OAuth flow once, saving the refresh token, then using it forever.
 *
 * Let me build a one-time OAuth flow.
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const http = require('http');
const { URL } = require('url');

const FIREBASE_API_KEY = 'AIzaSyADtP9ZTyPUIqk7T9xHvEuEXhe--IYYLWw';
const FIREBASE_PROJECT_ID = 'train-165d3';

// Google OAuth - we'll use Firebase's built-in Google provider
// For headless auth, we use the Firebase REST API with a Google ID token

// Step 1: Check if we have a saved refresh token
const fs = require('fs');
const path = require('path');
const REFRESH_TOKEN_FILE = path.join(__dirname, '..', '.motra_refresh_token');

async function refreshIdToken(refreshToken) {
  console.log('🔄 Refreshing Firebase ID token...');
  const res = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`
    }
  );
  
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${errText}`);
  }
  
  const data = await res.json();
  console.log('✅ Got fresh ID token!');
  console.log(`   Expires in: ${data.expires_in} seconds`);
  console.log(`   User ID: ${data.user_id}`);
  console.log(`   Token prefix: ${data.id_token.substring(0, 50)}...`);
  
  return {
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    userId: data.user_id
  };
}

async function testMotraApi(idToken) {
  console.log('\n📡 Testing fresh token against Motra API...');
  const res = await fetch('https://backend.motra.com/user/muscle-recovery', {
    headers: {
      'Host': 'backend.motra.com',
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'User-Agent': 'Motra/1 CFNetwork/3892.100.1 Darwin/27.0.0',
      'Authorization': `Bearer ${idToken}`,
      'Accept-Language': 'en-IN,en;q=0.9'
    }
  });
  
  console.log(`   Status: ${res.status}`);
  if (res.ok) {
    const data = await res.json();
    const muscles = data.data?.musclesRecoveryStats || [];
    console.log(`✅ Success! Got ${muscles.length} muscles`);
    muscles.forEach(m => {
      console.log(`   💪 ${m.muscle}: ${m.recovery}% (${m.daysToRecovery}d to recover)`);
    });
    return data;
  } else {
    const text = await res.text();
    console.log(`❌ Failed: ${text}`);
    return null;
  }
}

async function main() {
  // Check for saved refresh token
  if (fs.existsSync(REFRESH_TOKEN_FILE)) {
    console.log('📂 Found saved refresh token!');
    const savedRefreshToken = fs.readFileSync(REFRESH_TOKEN_FILE, 'utf8').trim();
    
    try {
      const tokens = await refreshIdToken(savedRefreshToken);
      // Save updated refresh token (Google sometimes rotates them)
      fs.writeFileSync(REFRESH_TOKEN_FILE, tokens.refreshToken);
      await testMotraApi(tokens.idToken);
      return;
    } catch (err) {
      console.log(`⚠️ Saved refresh token failed: ${err.message}`);
      console.log('   Need to re-authenticate...\n');
    }
  }
  
  // No saved refresh token - need to do initial OAuth flow
  console.log('='.repeat(60));
  console.log('🔐 INITIAL SETUP: One-time Google Sign-In Required');
  console.log('='.repeat(60));
  console.log('');
  console.log('To get a permanent refresh token, you need to sign in once.');
  console.log('');
  console.log('Option 1: Capture refresh token from ProxyPin');
  console.log('   Open Motra app → ProxyPin will capture a request to:');
  console.log('   securetoken.googleapis.com/v1/token');
  console.log('   The "refresh_token" field in the response is what we need.');
  console.log('');
  console.log('Option 2: Use Firebase Auth REST sign-in');
  console.log('   If you have a Google OAuth ID token, run:');
  console.log('   node scripts/motra_auth.cjs --google-token <YOUR_GOOGLE_ID_TOKEN>');
  console.log('');
  console.log('Option 3: Paste your refresh token directly');
  console.log('   Save it to: .motra_refresh_token in the project root');
  console.log('');
  
  // Check if --google-token arg was passed
  const googleTokenIdx = process.argv.indexOf('--google-token');
  if (googleTokenIdx !== -1 && process.argv[googleTokenIdx + 1]) {
    const googleIdToken = process.argv[googleTokenIdx + 1];
    console.log('🔄 Exchanging Google ID token for Firebase credentials...');
    
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postBody: `id_token=${googleIdToken}&providerId=google.com`,
          requestUri: 'https://train-165d3.firebaseapp.com',
          returnIdpCredential: true,
          returnSecureToken: true
        })
      }
    );
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Firebase sign-in successful!');
      console.log(`   Email: ${data.email}`);
      console.log(`   User ID: ${data.localId}`);
      
      if (data.refreshToken) {
        fs.writeFileSync(REFRESH_TOKEN_FILE, data.refreshToken);
        console.log(`✅ Refresh token saved to ${REFRESH_TOKEN_FILE}`);
        await testMotraApi(data.idToken);
      }
    } else {
      const errText = await res.text();
      console.log(`❌ Sign-in failed: ${errText}`);
    }
    return;
  }
  
  // Check if --refresh-token arg was passed
  const rtIdx = process.argv.indexOf('--refresh-token');
  if (rtIdx !== -1 && process.argv[rtIdx + 1]) {
    const rt = process.argv[rtIdx + 1];
    fs.writeFileSync(REFRESH_TOKEN_FILE, rt);
    console.log('✅ Refresh token saved!');
    const tokens = await refreshIdToken(rt);
    fs.writeFileSync(REFRESH_TOKEN_FILE, tokens.refreshToken);
    await testMotraApi(tokens.idToken);
    return;
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
