import React, { useState } from 'react';
import { ArrowUpRight, Monitor, ExternalLink, Copy, Check, Sparkles } from 'lucide-react';

const OUTBOUND_ENDPOINTS = [
  {
    name: 'GET /api/dash',
    badge: 'PRIMARY E-PAPER ENDPOINT',
    description: 'Universal aggregated payload containing class schedule, next exam, AC power, AI usage, Todoist, MedX tracker/study time, and Motra 18 muscles.',
    consumer: 'Universal E-Paper Display Hardware',
    responseExample: `{
  "timestamp": "2026-07-26T14:28:07.919Z",
  "class_schedule": { "status": "no class today", "classes": [] },
  "exams": { "total_upcoming": 2, "next_exam": { "subject": "Pharmacology Exam", "date": "2026-07-27" } },
  "ac_power": { "today_kwh": "6.84", "week_kwh": "6.84", "month_kwh": "82.52" },
  "ai_usage": { "rolling_5h": "3%", "weekly_usage": "23%", "monthly_usage": "68%" },
  "todoist": { "total_pending": 3, "tasks": [...], "shopping_list": [...] },
  "medx_tracker": { "completion_percentage": "0.0%", "items_progress": "0/121" },
  "medx_studytime": { "study_progress": "0.00/11 hrs", "pyq_progress": "0.00/2 hrs" },
  "motra": { "overall_recovery": "100%", "recovered_muscles": "18/18", "muscles": { "abductors": {...}, ... } }
}`
  },
  {
    name: 'GET /api/schedule',
    badge: 'SCHEDULE QUERY API',
    description: 'Returns clean structured classes list and upcoming exams schedule.',
    consumer: 'Hermes Agent / Mobile App',
    responseExample: `{
  "status": "success",
  "data": {
    "classes": { "total_classes": 0, "classes": [] },
    "exams": { "total_upcoming": 5, "exams": [...] }
  }
}`
  },
  {
    name: 'GET /api/motra',
    badge: 'FITNESS TELEMETRY API',
    description: 'Returns individual recovery percentage, days to recovery, and days since last used for all 18 muscles.',
    consumer: 'Fitness Dashboard / E-Paper Display',
    responseExample: `{
  "status": "success",
  "data": {
    "overall_recovery": "100%",
    "recovered_muscles": "18/18",
    "muscles": { "chest": { "recovery": 100, "daysToRecovery": 0 }, ... }
  }
}`
  }
];

export const OutboundApis = ({ onToast }) => {
  const [copiedName, setCopiedName] = useState(null);

  const handleCopy = (name) => {
    const fullUrl = `https://daily-api-five.vercel.app${name.replace('GET ', '')}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedName(name);
    onToast(`Copied Vercel endpoint URL: ${fullUrl}`);
    setTimeout(() => setCopiedName(null), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Outbound APIs</h2>
          <p className="page-description">Vercel serverless consumer endpoints serving sanitized JSON to E-Paper hardware & external displays</p>
        </div>
      </div>

      {/* Outbound Endpoint List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {OUTBOUND_ENDPOINTS.map((ep, idx) => (
          <div key={idx} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="method-badge get">GET</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{ep.name}</h3>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  {ep.badge}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => handleCopy(ep.name)}>
                  {copiedName === ep.name ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
                  {copiedName === ep.name ? 'Copied URL' : 'Copy Vercel URL'}
                </button>
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '14px' }}>
              {ep.description}
            </p>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '14px' }}>
              <strong>Primary Consumer:</strong> <span style={{ color: 'var(--text-light)' }}>{ep.consumer}</span>
            </div>

            <div style={{ background: '#090d16', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                Consumer Response Format:
              </div>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#cbd5e1', margin: 0 }}>
                {ep.responseExample}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
