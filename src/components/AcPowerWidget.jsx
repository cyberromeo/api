import React from 'react';
import { Zap, Calendar, TrendingUp, Sun, Flame, CheckCircle, Clock } from 'lucide-react';

export const AcPowerWidget = ({ feedData }) => {
  // Find latest AC_POWER payload or fallback to sample preview data
  const acFeed = feedData ? feedData.find(f => f.apiName === 'AC_POWER') : null;
  const payload = acFeed?.payload || {
    summary: {
      todayKwh: 4.85,
      thisWeekKwh: 29.40,
      thisMonthKwh: 118.50,
      unit: 'kWh'
    },
    lastUpdated: new Date().toISOString()
  };

  const { todayKwh = 0, thisWeekKwh = 0, thisMonthKwh = 0 } = payload.summary || {};
  const lastUpdatedFormatted = payload.lastUpdated ? new Date(payload.lastUpdated).toLocaleTimeString() : 'Live';

  return (
    <div className="glass-card" style={{ marginBottom: '28px', borderLeft: '4px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="metric-icon-box" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))', color: '#a5b4fc' }}>
            <Zap size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em' }}>AC Power Consumption</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>MirAIe Panasonic Device #36ff8e5467b2</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="feed-tag" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-emerald)', borderColor: 'rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={13} /> Updated {lastUpdatedFormatted}
          </span>
        </div>
      </div>

      {/* 3 Metrics Cards Grid */}
      <div className="grid-3" style={{ marginBottom: '0' }}>
        {/* Today's Usage */}
        <div style={{ background: 'rgba(13, 19, 33, 0.6)', padding: '18px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sun size={15} style={{ color: 'var(--accent-amber)' }} /> Today's Usage
            </span>
            <span style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              DAILY
            </span>
          </div>

          <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.03em', margin: '4px 0 8px 0' }}>
            {todayKwh} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>kWh</span>
          </div>

          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min((todayKwh / 10) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-amber), var(--accent-rose))', borderRadius: '3px', transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* This Week's Usage */}
        <div style={{ background: 'rgba(13, 19, 33, 0.6)', padding: '18px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={15} style={{ color: 'var(--accent-cyan)' }} /> This Week's Usage
            </span>
            <span style={{ fontSize: '0.72rem', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              WEEKLY
            </span>
          </div>

          <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.03em', margin: '4px 0 8px 0' }}>
            {thisWeekKwh} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>kWh</span>
          </div>

          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min((thisWeekKwh / 50) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-cyan), var(--primary))', borderRadius: '3px', transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* This Month's Usage */}
        <div style={{ background: 'rgba(13, 19, 33, 0.6)', padding: '18px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} style={{ color: 'var(--primary)' }} /> This Month's Usage
            </span>
            <span style={{ fontSize: '0.72rem', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              MONTHLY
            </span>
          </div>

          <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.03em', margin: '4px 0 8px 0' }}>
            {thisMonthKwh} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>kWh</span>
          </div>

          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min((thisMonthKwh / 200) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #a5b4fc)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
