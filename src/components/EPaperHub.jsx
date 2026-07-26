import React, { useState } from 'react';
import { Monitor, Cpu, Copy, Check, Zap, Radio, Bot, CheckSquare, BookOpen, Activity, Dumbbell, Calendar, GraduationCap, Send } from 'lucide-react';

export const EPaperHub = ({ feeds, onToast }) => {
  const [copiedEndpoint, setCopiedEndpoint] = useState(null);

  // Extract AC Power feed values
  const acFeed = feeds ? feeds.find(f => f.apiName === 'AC_POWER') : null;
  const acSummary = acFeed?.payload?.summary || {
    todayKwh: 5.08,
    thisWeekKwh: 5.08,
    thisMonthKwh: 80.76,
    unit: 'kWh'
  };

  // Extract AI Usage feed values
  const aiFeed = feeds ? feeds.find(f => f.apiName === 'AI_USAGE') : null;
  const aiSummary = aiFeed?.payload?.summary || {
    rolling: { percentage: 0, resetIn: "25 minutes" },
    weekly: { percentage: 22, resetIn: "16 hours 50 minutes" },
    monthly: { percentage: 68, resetIn: "12 days 8 hours" }
  };

  // Extract Todoist feed values
  const todoistFeed = feeds ? feeds.find(f => f.apiName === 'TODOIST') : null;
  const todoistPayload = todoistFeed?.payload || {
    totalPending: 3,
    tasks: [
      { id: "1", content: "Buy specs 👓", due: "this Sunday evening", priority: 1, isOverdue: true },
      { id: "2", content: "Book psychiatrist appointment", due: "2026-07-10", priority: 3, isOverdue: true }
    ]
  };

  // Extract MedX Tracker feed values
  const medxTrackerFeed = feeds ? feeds.find(f => f.apiName === 'MEDX_TRACKER' || f.apiName === 'MEDX') : null;
  const medxTrackerSummary = medxTrackerFeed?.payload?.summary || {
    completionPercentage: "0.0%",
    completedSubjects: 0,
    totalSubjects: 19,
    completedGts: 0,
    totalGts: 7,
    completedItems: 0,
    totalItems: 121
  };

  // Extract MedX StudyTime feed values
  const medxStudyFeed = feeds ? feeds.find(f => f.apiName === 'MEDX_STUDYTIME' || f.apiName === 'MEDX') : null;
  const medxStudySummary = medxStudyFeed?.payload?.summary || {
    todayStudyHours: "0.00",
    todayPyqHours: "0.00",
    streakDays: 0,
    weeklyGrandTotalHours: "0.17"
  };

  // Extract Motra feed values
  const motraFeed = feeds ? feeds.find(f => f.apiName === 'MOTRA') : null;
  const motraSummary = motraFeed?.payload?.summary || {
    overallRecoveryPct: "100%",
    recoveredMuscles: "18/18",
    recoveringMuscles: 0,
    daysSinceLastWorkout: 245
  };

  // Extract Class Schedule feed values
  const classFeed = feeds ? feeds.find(f => f.apiName === 'CLASS_SCHEDULE') : null;
  const classPayload = classFeed?.payload || {
    date: new Date().toISOString().split('T')[0],
    total_classes: 3,
    classes: [
      { id: "cls_1", subject: "Pathology Lecture", time: "09:00 AM - 10:30 AM", room: "Hall A", topic: "Cell Injury" },
      { id: "cls_2", subject: "Pharmacology Practical", time: "11:00 AM - 01:00 PM", room: "Lab 2", topic: "Autonomic NS" }
    ]
  };

  // Extract Exams feed values
  const examsFeed = feeds ? feeds.find(f => f.apiName === 'EXAMS_SCHEDULE') : null;
  const examsPayload = examsFeed?.payload || {
    total_upcoming: 2,
    exams: [
      { id: "ex_1", name: "FMGE July 2026 Grand Test", date: "2026-08-15", days_remaining: 20, venue: "Exam Hall 1" },
      { id: "ex_2", name: "Pathology Midterm Exam", date: "2026-08-01", days_remaining: 6, venue: "Hall B" }
    ]
  };

  const hostUrl = window.location.origin;
  const classScheduleApiUrl = `${hostUrl}/api/class-schedule`;
  const examsApiUrl = `${hostUrl}/api/exams`;
  const acPowerApiUrl = `${hostUrl}/api/ac-power`;
  const aiUsageApiUrl = `${hostUrl}/api/ai-usage`;
  const todoistApiUrl = `${hostUrl}/api/todoist`;
  const medxTrackerApiUrl = `${hostUrl}/api/medx-tracker`;
  const medxStudyApiUrl = `${hostUrl}/api/medx-study`;
  const motraApiUrl = `${hostUrl}/api/motra`;
  const masterApiUrl = `${hostUrl}/api/epaper`;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(key);
    onToast(`Copied ${key} URL to clipboard!`);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">E-Paper Display API Hub & Hermes Agent Push Gateway</h2>
          <p className="page-description">Hardware endpoints & POST API endpoints for Hermes Agent to push Class Schedule & Exams DB</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '28px' }}>
        {/* Hermes Agent Push Gateways */}
        <div className="glass-card" style={{ border: '2px solid rgba(59,130,246,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Send size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Hermes Agent Push API Links</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Use these POST endpoints in your Hermes Agent script to update Class Schedules & Exams</p>
            </div>
          </div>

          {/* 1. Class Schedule Push Link */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '12px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary)' }}>POST /api/class-schedule</span>
              <button className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.72rem' }} onClick={() => copyToClipboard(classScheduleApiUrl, 'Class Schedule Push API')}>
                {copiedEndpoint === 'Class Schedule Push API' ? <Check size={12} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={12} />}
                {copiedEndpoint === 'Class Schedule Push API' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: '#60a5fa', wordBreak: 'break-all', marginBottom: '8px' }}>
              {classScheduleApiUrl}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <strong>Body Payload Example:</strong>
              <pre style={{ background: '#0b0f19', padding: '8px', borderRadius: '6px', fontSize: '0.68rem', marginTop: '4px', overflowX: 'auto' }}>{`{
  "source": "Hermes Agent",
  "date": "2026-07-26",
  "classes": [
    { "subject": "Pathology", "time": "09:00 AM - 10:30 AM", "room": "Hall A", "topic": "Cell Injury" },
    { "subject": "Pharmacology", "time": "11:00 AM - 01:00 PM", "room": "Lab 2", "topic": "Autonomic NS" }
  ]
}`}</pre>
            </div>
          </div>

          {/* 2. Exams Schedule Push Link */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-amber)' }}>POST /api/exams</span>
              <button className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.72rem' }} onClick={() => copyToClipboard(examsApiUrl, 'Exams Push API')}>
                {copiedEndpoint === 'Exams Push API' ? <Check size={12} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={12} />}
                {copiedEndpoint === 'Exams Push API' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: '#fbbf24', wordBreak: 'break-all', marginBottom: '8px' }}>
              {examsApiUrl}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <strong>Body Payload Example:</strong>
              <pre style={{ background: '#0b0f19', padding: '8px', borderRadius: '6px', fontSize: '0.68rem', marginTop: '4px', overflowX: 'auto' }}>{`{
  "source": "Hermes Agent",
  "exams": [
    { "name": "FMGE July GT", "subject": "All", "date": "2026-08-15", "venue": "Hall 1", "total_marks": 300 }
  ]
}`}</pre>
            </div>
          </div>
        </div>

        {/* E-Paper Screen Visual Simulator */}
        <div className="glass-card" style={{ border: '2px solid rgba(255,255,255,0.15)', background: '#07090e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Monitor size={18} style={{ color: 'var(--accent-cyan)' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-muted)' }}>E-Paper Preview with Schedule & Exams</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Radio size={12} /> Live Render
            </span>
          </div>

          {/* E-Paper Screen Container */}
          <div style={{
            background: '#e8ecef',
            color: '#111827',
            padding: '14px',
            borderRadius: '12px',
            fontFamily: 'var(--font-sans)',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)',
            border: '4px solid #374151'
          }}>
            {/* Widget 1: Class Schedule (Hermes Agent Synced) */}
            <div style={{ borderBottom: '2px solid #111827', paddingBottom: '6px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800', fontSize: '0.8rem' }}>
                  <Calendar size={14} /> TODAY'S CLASSES ({classPayload.total_classes || 0})
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#4b5563' }}>
                  Synced via Hermes Agent
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '4px', border: '1px solid #9ca3af', padding: '6px' }}>
                {(classPayload.classes || []).slice(0, 2).map((cls, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', padding: '2px 0', borderBottom: i === 0 ? '1px solid #e5e7eb' : 'none' }}>
                    <span style={{ fontWeight: 700 }}>• {cls.subject} ({cls.room})</span>
                    <span style={{ color: '#4b5563', fontWeight: 600 }}>{cls.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 2: Upcoming Exams */}
            <div style={{ borderBottom: '2px solid #111827', paddingBottom: '6px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800', fontSize: '0.8rem', marginBottom: '4px' }}>
                <GraduationCap size={14} /> UPCOMING EXAMS ({examsPayload.total_upcoming || 0})
              </div>

              <div style={{ background: '#ffffff', borderRadius: '4px', border: '1px solid #9ca3af', padding: '6px' }}>
                {(examsPayload.exams || []).slice(0, 2).map((ex, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', padding: '2px 0' }}>
                    <span style={{ fontWeight: 700 }}>🏆 {ex.name}</span>
                    <span style={{ color: '#dc2626', fontWeight: 800 }}>{ex.days_remaining != null ? `${ex.days_remaining} days left` : ex.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 3: Fitness & Study */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', textAlign: 'center' }}>
              <div style={{ background: '#ffffff', padding: '4px', borderRadius: '4px', border: '1px solid #9ca3af' }}>
                <div style={{ fontSize: '0.52rem', fontWeight: '700', color: '#4b5563' }}>MOTRA</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '900' }}>{motraSummary.overallRecoveryPct}</div>
              </div>

              <div style={{ background: '#ffffff', padding: '4px', borderRadius: '4px', border: '1px solid #9ca3af' }}>
                <div style={{ fontSize: '0.52rem', fontWeight: '700', color: '#4b5563' }}>STUDY</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '900' }}>{medxStudySummary.todayStudyHours}h</div>
              </div>

              <div style={{ background: '#ffffff', padding: '4px', borderRadius: '4px', border: '1px solid #9ca3af' }}>
                <div style={{ fontSize: '0.52rem', fontWeight: '700', color: '#4b5563' }}>TRACKER</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '900' }}>{medxTrackerSummary.completionPercentage}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
