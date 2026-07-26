import React, { useState } from 'react';
import { Database, Clock, Copy, Search, RefreshCw, Check, Sparkles } from 'lucide-react';

export const DatabaseLogs = ({ feeds, onToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const filteredFeeds = feeds.filter(f => {
    const nameStr = (f.apiName || f.id || '').toLowerCase();
    const sourceStr = (f.source || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return nameStr.includes(searchLower) || sourceStr.includes(searchLower);
  });

  const handleCopyJson = (id, payload) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedId(id);
    onToast("Copied raw payload JSON to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Database Logs</h2>
          <p className="page-description">Firestore live document stream with exact last updated timestamps</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="glass-card" style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} style={{ color: 'var(--primary)' }} />
            <span><strong>{feeds.length}</strong> Total Documents</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none' }}
            placeholder="Search documents by API feed name or source (e.g. AC_POWER, MOTRA, Hermes Agent)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setSearchTerm('')}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Database Document Log Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredFeeds.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No database log entries match "{searchTerm}".
          </div>
        ) : (
          filteredFeeds.map(item => {
            const isExpanded = expandedId === item.id;
            const updatedTime = item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A';

            return (
              <div key={item.id} className="glass-card" style={{ borderLeft: '4px solid var(--primary)', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span className="feed-tag">{item.apiName || item.id}</span>
                      <span style={{ fontSize: '0.78rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                        ● {item.status || 'SUCCESS'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        Source: <strong style={{ color: 'var(--text-light)' }}>{item.source || 'Worker'}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <Clock size={14} />
                      <span>Last Updated: <strong style={{ color: '#e2e8f0' }}>{updatedTime}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => handleCopyJson(item.id, item.payload)}
                    >
                      {copiedId === item.id ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
                      {copiedId === item.id ? 'Copied' : 'Copy JSON'}
                    </button>

                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      {isExpanded ? 'Collapse' : 'View Payload'}
                    </button>
                  </div>
                </div>

                {/* Raw Payload JSON Preview */}
                {isExpanded && (
                  <div style={{ marginTop: '16px', background: '#090d16', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                      <span>RAW FIRESTORE PAYLOAD DOCUMENT</span>
                      <span>DOCUMENT ID: {item.id}</span>
                    </div>
                    <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#cbd5e1', margin: 0 }}>
                      {JSON.stringify(item.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
