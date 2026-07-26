import React from 'react';
import { ArrowDownLeft, Terminal, Send, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

const INBOUND_ENDPOINTS = [
  {
    name: 'POST /api/schedule',
    description: 'Unified push endpoint for Hermes Agent to push classes & upcoming exams together.',
    method: 'POST',
    source: 'Hermes Agent / cURL',
    schedule: 'On Event / Scheduled Push',
    payloadExample: `{
  "classes": [
    { "subject": "Pathology", "start_date": "2026-07-04", "end_date": "2026-07-07" }
  ],
  "exams": [
    { "subject": "FMGE GT", "date": "2026-08-15" }
  ]
}`
  },
  {
    name: 'Cronicle Workers → Firestore Direct',
    description: 'Automated staggered worker scripts running on Umbrel local node (6 AM - 12 AM).',
    method: 'PATCH',
    source: 'Cronicle Server (http://umbrel.local:3012)',
    schedule: '6 AM to 12 AM (Staggered 30-min intervals)',
    payloadExample: `{
  "apiName": "MOTRA",
  "source": "Motra Worker (Auto-Refresh)",
  "payload": { "summary": { "overallRecoveryPct": "100%" } }
}`
  },
  {
    name: 'POST /api/medx',
    description: 'Inbound push endpoint for MedX Study Time and Tracker progress updates.',
    method: 'POST',
    source: 'MedX Script / Webhook',
    schedule: 'Every 30 Mins (00 & 30)',
    payloadExample: `{
  "study_hours": "3.50",
  "pyq_hours": "1.00",
  "completed_items": 45
}`
  }
];

export const InboundApis = ({ onToast }) => {
  const handleCopyEndpoint = (url) => {
    navigator.clipboard.writeText(url);
    onToast(`Copied ${url} to clipboard!`);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Inbound APIs</h2>
          <p className="page-description">Ingestion endpoints & automated worker pipelines pushing telemetry into Firestore</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: '24px' }}>
        <div className="glass-card metric-card">
          <div className="metric-icon-box">
            <ArrowDownLeft size={24} />
          </div>
          <div>
            <div className="metric-label">Ingestion Endpoints</div>
            <div className="metric-value">3 Active</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon-box" style={{ color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.12)' }}>
            <Terminal size={24} />
          </div>
          <div>
            <div className="metric-label">Cronicle Automated Jobs</div>
            <div className="metric-value" style={{ fontSize: '1.2rem' }}>6 Staggered Crons</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon-box" style={{ color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.12)' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="metric-label">Ingestion Security</div>
            <div className="metric-value" style={{ fontSize: '1.2rem', color: 'var(--accent-emerald)' }}>Firebase Admin Auth</div>
          </div>
        </div>
      </div>

      {/* Inbound Endpoint List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {INBOUND_ENDPOINTS.map((ep, idx) => (
          <div key={idx} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="method-badge post">{ep.method}</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{ep.name}</h3>
              </div>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleCopyEndpoint(ep.name)}>
                Copy Route
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '14px' }}>
              {ep.description}
            </p>

            <div style={{ display: 'flex', gap: '20px', fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '14px' }}>
              <div><strong>Primary Source:</strong> {ep.source}</div>
              <div><strong>Frequency:</strong> {ep.schedule}</div>
            </div>

            <div style={{ background: '#090d16', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                Sample Inbound Body:
              </div>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#cbd5e1', margin: 0 }}>
                {ep.payloadExample}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
