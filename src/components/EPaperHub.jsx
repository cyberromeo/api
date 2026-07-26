import React, { useState } from 'react';
import { Monitor, Cpu, Copy, Check, Zap, Radio, Bot, CheckSquare, BookOpen, Activity, Dumbbell, Calendar, GraduationCap, Send } from 'lucide-react';

export const EPaperHub = ({ feeds, onToast }) => {
  const [copiedEndpoint, setCopiedEndpoint] = useState(null);

  // Extract AC Power feed values
  const acFeed = feeds ? feeds.find(f => f.apiName === 'AC_POWER') : null;
  const acSummary = acFeed?.payload?.summary || {
    todayKwh: 0,
    thisWeekKwh: 0,
    thisMonthKwh: 0,
    unit: 'kWh'
  };

  // Extract AI Usage feed values
  const aiFeed = feeds ? feeds.find(f => f.apiName === 'AI_USAGE') : null;
  const aiSummary = aiFeed?.payload?.summary || {
    rolling: { percentage: 0, resetIn: "N/A" },
    weekly: { percentage: 0, resetIn: "N/A" },
    monthly: { percentage: 0, resetIn: "N/A" }
  };

  // Extract Todoist feed values
  const todoistFeed = feeds ? feeds.find(f => f.apiName === 'TODOIST') : null;
  const todoistPayload = todoistFeed?.payload || {
    totalPending: 0,
    tasks: []
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
    weeklyGrandTotalHours: "0.00"
  };

  // Extract Motra feed values
  const motraFeed = feeds ? feeds.find(f => f.apiName === 'MOTRA') : null;
  const motraSummary = motraFeed?.payload?.summary || {
    overallRecoveryPct: "100%",
    recoveredMuscles: "18/18",
    recoveringMuscles: 0,
    daysSinceLastWorkout: 0
  };

  // Extract Class Schedule feed values (Subject & Date only)
  const classFeed = feeds ? feeds.find(f => f.apiName === 'CLASS_SCHEDULE') : null;
  const classPayload = classFeed?.payload || {
    total_classes: 0,
    classes: []
  };

  // Extract Exams feed values (Subject & Date only)
  const examsFeed = feeds ? feeds.find(f => f.apiName === 'EXAMS_SCHEDULE') : null;
  const examsPayload = examsFeed?.payload || {
    total_upcoming: 0,
    exams: []
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
  const dashApiUrl = `${hostUrl}/api/dash`;

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
          <p className="page-description">Master /api/dash endpoint & POST endpoints for Hermes Agent schedule pushes</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '28px' }}>
        {/* Hermes Agent Push Gateways */}
        <div className="glass-card" style={{ border: '2px solid rgba(59,130,246,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Send size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Hermes Agent Push API Links</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>POST endpoints to update Class Schedules & Exams (subject & date only)</p>
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
  "classes": [
    { "subject": "Pathology Lecture", "date": "2026-07-26 09:00 AM" }
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
    { "subject": "FMGE July Grand Test", "date": "2026-08-15" }
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
            {/* Widget 1: Class Schedule */}
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
                {(classPayload.classes || []).length > 0 ? (
                  (classPayload.classes || []).map((cls, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', padding: '2px 0' }}>
                      <span style={{ fontWeight: 700 }}>• {cls.subject}</span>
                      <span style={{ color: '#4b5563', fontWeight: 600 }}>{cls.date}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', fontStyle: 'italic', textAlign: 'center' }}>
                    no class today
                  </div>
                )}
              </div>
            </div>

            {/* Widget 2: Upcoming Exams */}
            <div style={{ borderBottom: '2px solid #111827', paddingBottom: '6px', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800', fontSize: '0.8rem', marginBottom: '4px' }}>
                <GraduationCap size={14} /> UPCOMING EXAMS ({examsPayload.total_upcoming || 0})
              </div>

              <div style={{ background: '#ffffff', borderRadius: '4px', border: '1px solid #9ca3af', padding: '6px' }}>
                {(examsPayload.exams || []).length > 0 ? (
                  (examsPayload.exams || []).map((ex, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', padding: '2px 0' }}>
                      <span style={{ fontWeight: 700 }}>🏆 {ex.subject}</span>
                      <span style={{ color: '#dc2626', fontWeight: 800 }}>{ex.date}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', fontStyle: 'italic', textAlign: 'center' }}>
                    no upcoming exams scheduled
                  </div>
                )}
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
