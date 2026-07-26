import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  BookOpen, 
  Terminal, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Monitor
} from 'lucide-react';
import { isFirebaseConfigured } from '../firebase/config';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'epaper', label: 'E-Paper Screen', icon: Monitor },
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'feed', label: 'Universal Feed', icon: Activity },
    { id: 'registry', label: 'API Registry', icon: BookOpen },
    { id: 'cronicle', label: 'Cronicle Workers', icon: Terminal },
  ];


  return (
    <aside className="sidebar">
      <div className="brand-header">
        <div className="brand-logo">
          <Zap size={22} />
        </div>
        <div>
          <h1 className="brand-title">epaper-api</h1>
          <span className="brand-subtitle">Vercel & Firebase</span>
        </div>
      </div>

      <ul className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <li key={item.id}>
              <button
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon className="nav-icon" />
                <span className="nav-text">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer">
        <div className={`status-badge ${isFirebaseConfigured ? '' : 'demo'}`}>
          <div className="pulse-dot"></div>
          <span className="sidebar-footer-text">
            {isFirebaseConfigured ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} /> Firebase Live
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> Demo Mode
              </span>
            )}
          </span>
        </div>
      </div>
    </aside>
  );
};
