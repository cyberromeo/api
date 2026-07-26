import React, { useState } from 'react';
import { BookOpen, Plus, ShieldCheck, Database, Trash2 } from 'lucide-react';

const INITIAL_REGISTRY = [
  {
    id: 'reg-1',
    name: 'AC_POWER',
    description: 'Panasonic MirAIe AC power consumption (Daily, Weekly, Monthly energy usage in kWh)',
    frequency: 'Every 15 mins (Cronicle)',
    schemaKeys: ['todayKwh', 'thisWeekKwh', 'thisMonthKwh', 'deviceId', 'lastUpdated'],
    status: 'ACTIVE'
  },

  {
    id: 'reg-2',
    name: 'WEATHER_SYNC',
    description: 'Local ambient temperature, humidity, and weather condition tracker',
    frequency: 'Hourly',
    schemaKeys: ['temperature_c', 'humidity', 'condition', 'wind_speed_kmh'],
    status: 'ACTIVE'
  },
  {
    id: 'reg-3',
    name: 'CUSTOM_FEED',
    description: 'Placeholder feed ready for your upcoming custom API payloads',
    frequency: 'User Defined',
    schemaKeys: ['id', 'timestamp', 'custom_metrics'],
    status: 'PENDING'
  }
];

export const EndpointRegistry = ({ onToast }) => {
  const [registry, setRegistry] = useState(INITIAL_REGISTRY);
  const [isAdding, setIsAdding] = useState(false);
  const [newApiName, setNewApiName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newFreq, setNewFreq] = useState('Every 10 mins');
  const [newKeys, setNewKeys] = useState('status, value, timestamp');

  const handleAddApi = (e) => {
    e.preventDefault();
    const newEntry = {
      id: 'reg-' + Date.now(),
      name: newApiName.toUpperCase().replace(/\s+/g, '_'),
      description: newDesc,
      frequency: newFreq,
      schemaKeys: newKeys.split(',').map(k => k.trim()),
      status: 'ACTIVE'
    };

    setRegistry([newEntry, ...registry]);
    onToast(`Registered new API schema for ${newEntry.name}`);
    setNewApiName('');
    setNewDesc('');
    setIsAdding(false);
  };

  const handleDelete = (id) => {
    setRegistry(registry.filter(item => item.id !== id));
    onToast("API endpoint schema removed");
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">API Endpoint Registry</h2>
          <p className="page-description">Schema catalog & contract management for your universal data feeds</p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
            <Plus size={16} /> {isAdding ? 'Close Form' : 'Register New API'}
          </button>
        </div>
      </div>

      {/* Add New API Form Modal/Card */}
      {isAdding && (
        <div className="glass-card" style={{ marginBottom: '28px', borderLeft: '4px solid var(--accent-cyan)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Register New Data Endpoint</h3>
          <form onSubmit={handleAddApi}>
            <div className="grid-2" style={{ marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  API Identifier Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. SOLAR_GENERATION or PAYMENT_METRICS"
                  value={newApiName}
                  onChange={(e) => setNewApiName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Push Frequency / Schedule
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Every 1 min, Hourly, Daily"
                  value={newFreq}
                  onChange={(e) => setNewFreq(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Description
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="What data does this API collect?"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Expected Field Keys (comma separated)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. voltage, current, power, status"
                value={newKeys}
                onChange={(e) => setNewKeys(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Save Schema Definition
            </button>
          </form>
        </div>
      )}

      {/* Registry Grid */}
      <div className="grid-2">
        {registry.map(item => (
          <div key={item.id} className="glass-card" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span className="feed-tag" style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', borderColor: 'rgba(6,182,212,0.3)' }}>
                  {item.name}
                </span>
                <span style={{ marginLeft: '10px', fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                  ● {item.status}
                </span>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '4px 8px', color: 'var(--accent-rose)' }}
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
              {item.description}
            </p>

            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
              <div><strong>Cron Schedule:</strong> {item.frequency}</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                Schema Contract Keys:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {item.schemaKeys.map(key => (
                  <span key={key} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', color: '#cbd5e1' }}>
                    {key}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
