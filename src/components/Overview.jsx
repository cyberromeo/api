import React, { useState } from 'react';
import { 
  Database, 
  Cpu, 
  Send, 
  Clock, 
  Sparkles, 
  Server, 
  Activity,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { isFirebaseConfigured } from '../firebase/config';
import { pushApiFeedRecord } from '../firebase/feedService';
import { AcPowerWidget } from './AcPowerWidget';

export const Overview = ({ feeds, onToast }) => {
  const [testApiName, setTestApiName] = useState('AC_POWER');
  const [testPayload, setTestPayload] = useState('{\n  "voltage": 230,\n  "current": 5.2,\n  "status": "ONLINE"\n}');
  const [isPushing, setIsPushing] = useState(false);

  const totalFeeds = feeds.length;
  const lastSync = feeds.length > 0 ? new Date(feeds[0].timestamp).toLocaleTimeString() : 'No data yet';

  const handleTestPush = async (e) => {
    e.preventDefault();
    try {
      setIsPushing(true);
      const parsedJson = JSON.parse(testPayload);
      await pushApiFeedRecord(testApiName, parsedJson, 'Dashboard Quick Test');
      onToast(`Successfully pushed payload for ${testApiName.toUpperCase()}`);
    } catch (err) {
      alert("Invalid JSON format or Push Error: " + err.message);
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Overview Widgets</h2>
          <p className="page-description">Real-time live telemetry widgets based on ingested data</p>
        </div>
      </div>

      {/* Primary Feature Widget: AC Power Telemetry */}
      <AcPowerWidget feedData={feeds} />

      {/* Metric Cards Grid */}
      <div className="grid-3">
        <div className="glass-card metric-card">
          <div className="metric-icon-box">
            <Database size={24} />
          </div>
          <div>
            <div className="metric-label">Total Ingested Feeds</div>
            <div className="metric-value">{totalFeeds}</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon-box" style={{ color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.12)' }}>
            <Server size={24} />
          </div>
          <div>
            <div className="metric-label">Database Connection</div>
            <div className="metric-value" style={{ fontSize: '1.2rem', color: 'var(--accent-emerald)' }}>
              {isFirebaseConfigured ? 'Firebase Firestore Live' : 'Demo Mode (Mock DB)'}
            </div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon-box" style={{ color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.12)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="metric-label">Last Ingestion Event</div>
            <div className="metric-value" style={{ fontSize: '1.2rem' }}>{lastSync}</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Quick Test Data Pusher */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Sparkles size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Simulate API Push</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
            Test your database pipe directly from the dashboard.
          </p>

          <form onSubmit={handleTestPush}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                API Feed Identifier
              </label>
              <input
                type="text"
                className="input-field"
                value={testApiName}
                onChange={(e) => setTestApiName(e.target.value)}
                placeholder="e.g. AC_POWER or MOTRA"
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                JSON Payload
              </label>
              <textarea
                className="input-field"
                style={{ fontFamily: 'var(--font-mono)', height: '110px', resize: 'vertical' }}
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isPushing}>
              <Send size={16} /> {isPushing ? 'Pushing Data...' : 'Push Payload to Firebase'}
            </button>
          </form>
        </div>

        {/* System Pipeline summary */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Cpu size={20} style={{ color: 'var(--accent-cyan)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Data Pipeline</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem' }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: '700', color: 'var(--accent-cyan)', marginBottom: '4px' }}>1. Cronicle Workers</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Runs 6 staggered crons every 30 minutes from 6 AM to 12 AM.
              </div>
            </div>

            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '4px' }}>2. Firebase Firestore</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Stores document feeds in <code>api_feeds</code> collection.
              </div>
            </div>

            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: '700', color: 'var(--accent-emerald)', marginBottom: '4px' }}>3. Universal E-Paper Output</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Exposes aggregated <code>GET /api/dash</code> for hardware displays.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
