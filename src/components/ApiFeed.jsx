import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { clearAllFeeds } from '../firebase/feedService';

export const ApiFeed = ({ feeds, onToast }) => {
  const [search, setSearch] = useState('');
  const [selectedApiFilter, setSelectedApiFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState(null);
  const [expandedMap, setExpandedMap] = useState({});

  // Unique list of API Names for filter selector
  const apiNames = ['ALL', ...Array.from(new Set(feeds.map(f => f.apiName)))];

  const filteredFeeds = feeds.filter(feed => {
    const matchesSearch = 
      feed.apiName.toLowerCase().includes(search.toLowerCase()) ||
      feed.source.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(feed.payload).toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = selectedApiFilter === 'ALL' || feed.apiName === selectedApiFilter;

    return matchesSearch && matchesFilter;
  });

  const toggleExpand = (id) => {
    setExpandedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyJson = (id, payload) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedId(id);
    onToast("JSON copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = async () => {
    if (window.confirm("Are you sure you want to clear all feed records?")) {
      await clearAllFeeds();
      onToast("All feeds cleared");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">epaper-api Live Stream</h2>
          <p className="page-description">Real-time data feeds ingested into Firebase</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleClear} disabled={feeds.length === 0}>
            <Trash2 size={16} /> Clear Stream
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '40px' }}
              placeholder="Search feed payload, API key, or source..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <select
              className="input-field"
              style={{ width: 'auto', minWidth: '160px', cursor: 'pointer' }}
              value={selectedApiFilter}
              onChange={(e) => setSelectedApiFilter(e.target.value)}
            >
              {apiNames.map(name => (
                <option key={name} value={name}>{name === 'ALL' ? 'All API Feeds' : name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feed Stream Cards */}
      {filteredFeeds.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Activity size={48} style={{ color: 'var(--text-dim)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '8px' }}>No Data Feeds Found</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            {feeds.length === 0 ? 'Push sample data from the Overview tab or trigger a Cronicle task.' : 'No records match your search filter.'}
          </p>
        </div>
      ) : (
        filteredFeeds.map(feed => {
          const isExpanded = expandedMap[feed.id] !== false; // Default expanded
          return (
            <div key={feed.id} className="glass-card feed-card">
              <div className="feed-header">
                <div className="feed-title-box">
                  <span className="feed-tag">{feed.apiName}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{feed.source}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="feed-time">{new Date(feed.timestamp).toLocaleString()}</span>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    onClick={() => handleCopyJson(feed.id, feed.payload)}
                  >
                    {copiedId === feed.id ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
                    {copiedId === feed.id ? 'Copied' : 'Copy JSON'}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 10px' }}
                    onClick={() => toggleExpand(feed.id)}
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="code-block" style={{ marginTop: '12px' }}>
                  <pre>{JSON.stringify(feed.payload, null, 2)}</pre>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
