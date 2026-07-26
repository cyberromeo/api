import React, { useState } from 'react';
import { Terminal, Copy, Check, ShieldCheck, Code, Cpu, ExternalLink, Play, Server } from 'lucide-react';
import { CRONICLE_URL, CRONICLE_API_KEY, runCronicleEvent } from '../services/cronicleService';

export const CronicleDocs = ({ onToast }) => {
  const [activeLang, setActiveLang] = useState('nodejs');
  const [copied, setCopied] = useState(false);
  const [manualEventName, setManualEventName] = useState('AC_POWER_SYNC');
  const [isTriggering, setIsTriggering] = useState(false);

  const nodejsSnippet = `// Cronicle Worker Script (Node.js)
// Save in your Cronicle job script or container runner on http://umbrel.local:3012/

const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin with your downloaded service account
if (!admin.apps.length) {
  const serviceAccount = require('./epaper-api-key-firebase-adminsdk-fbsvc-14ee0d69d4.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function runCronicleJob() {
  try {
    console.log("Fetching target API data...");
    
    // 1. Fetch data from your target API (e.g. AC Power meter / external feed)
    // Replace with your actual target API URL
    const response = await axios.get('https://api.example.com/data');
    const apiPayload = response.data;

    // 2. Push structured document to Firebase Firestore 'api_feeds'
    const docRef = await db.collection('api_feeds').add({
      apiName: 'AC_POWER',
      source: 'Cronicle Umbrel Worker',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'success',
      payload: apiPayload
    });

    console.log("Successfully pushed feed record ID:", docRef.id);
    process.exit(0);
  } catch (error) {
    console.error("Cronicle Job Failed:", error);
    process.exit(1);
  }
}

runCronicleJob();`;

  const pythonSnippet = `# Cronicle Worker Script (Python)
# Requirements: pip install firebase-admin requests

import requests
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin
if not firebase_admin._apps:
    cred = credentials.Certificate('epaper-api-key-firebase-adminsdk-fbsvc-14ee0d69d4.json')
    firebase_admin.initialize_app(cred)

db = firestore.client()

def run_job():
    try:
        # 1. Fetch target API data
        resp = requests.get('https://api.example.com/data')
        data = resp.json()

        # 2. Push to Firebase Firestore
        doc_ref = db.collection('api_feeds').add({
            'apiName': 'AC_POWER',
            'source': 'Cronicle Umbrel Python Worker',
            'timestamp': firestore.SERVER_TIMESTAMP,
            'status': 'success',
            'payload': data
        })

        print(f"Success! Document ID: {doc_ref[1].id}")
    except Exception as e:
        print(f"Error: {e}")
        exit(1)

if __name__ == "__main__":
    run_job()`;

  const curlSnippet = `# Trigger Cronicle Job via API on your Umbrel Server
# Your Cronicle API Key: ${CRONICLE_API_KEY}

curl -X POST \\
  "${CRONICLE_URL}/api/app/run_event/v1?api_key=${CRONICLE_API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "AC_POWER_SYNC"
  }'`;

  const currentSnippet = 
    activeLang === 'nodejs' ? nodejsSnippet :
    activeLang === 'python' ? pythonSnippet : curlSnippet;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    onToast("Snippet copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerCronicle = async (e) => {
    e.preventDefault();
    setIsTriggering(true);
    try {
      const res = await runCronicleEvent(manualEventName);
      if (res.code === 0) {
        onToast(`Cronicle event '${manualEventName}' triggered successfully!`);
      } else {
        onToast(`Cronicle response: ${res.description || 'Trigger sent'}`);
      }
    } catch (err) {
      alert(`Could not connect directly from browser to ${CRONICLE_URL} (CORS or local network restriction). You can use the cURL command or open Cronicle UI directly!`);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Cronicle Integration Hub</h2>
          <p className="page-description">Schedule, push & manage jobs running on your local Umbrel Cronicle server</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a 
            href={CRONICLE_URL} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <ExternalLink size={16} /> Open Cronicle Dashboard
          </a>
        </div>
      </div>

      {/* Server Status Header */}
      <div className="glass-card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent-emerald)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Server size={24} style={{ color: 'var(--accent-emerald)' }} />
            <div>
              <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>Cronicle Server Instance</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {CRONICLE_URL}
              </div>
            </div>
          </div>
          <div>
            <span className="feed-tag" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-emerald)', borderColor: 'rgba(16,185,129,0.3)' }}>
              API KEY CONFIGURED
            </span>
          </div>
        </div>
      </div>

      {/* Quick Trigger Tool */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Play size={18} style={{ color: 'var(--primary)' }} /> Trigger Cronicle Event Remotely
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
          Send a REST API command to run an event on <code>{CRONICLE_URL}</code> using API key <code>{CRONICLE_API_KEY.substring(0, 8)}...</code>
        </p>

        <form onSubmit={handleTriggerCronicle} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="input-field"
            style={{ flex: '1', minWidth: '220px' }}
            placeholder="Cronicle Event Title or ID (e.g. AC_POWER_SYNC)"
            value={manualEventName}
            onChange={(e) => setManualEventName(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={isTriggering}>
            <Play size={16} /> {isTriggering ? 'Triggering...' : 'Run Event Now'}
          </button>
        </form>
      </div>

      {/* Guide Cards */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Terminal size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>1. Umbrel Cronicle</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Running on <code>http://umbrel.local:3012</code>. Create your job schedule in the Cronicle Web UI.
          </p>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--accent-cyan)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>2. Firebase Key File</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Use <code>epaper-api-key-firebase-adminsdk-fbsvc-14ee0d69d4.json</code> in your task folder to authenticate Firestore.
          </p>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Cpu size={20} style={{ color: 'var(--accent-emerald)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>3. Live Stream</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            When Cronicle pushes to Firestore, your <code>epaper-api</code> web dashboard updates instantly!
          </p>
        </div>
      </div>

      {/* Code Snippet Box */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn ${activeLang === 'nodejs' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveLang('nodejs')}
            >
              Node.js Worker
            </button>
            <button 
              className={`btn ${activeLang === 'python' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveLang('python')}
            >
              Python Worker
            </button>
            <button 
              className={`btn ${activeLang === 'curl' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveLang('curl')}
            >
              cURL / REST API
            </button>
          </div>

          <button className="btn btn-secondary" onClick={handleCopy}>
            {copied ? <Check size={16} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        <div className="code-block" style={{ fontSize: '0.88rem' }}>
          <pre>{currentSnippet}</pre>
        </div>
      </div>
    </div>
  );
};
