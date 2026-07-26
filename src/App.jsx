import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Overview } from './components/Overview';
import { DatabaseLogs } from './components/DatabaseLogs';
import { InboundApis } from './components/InboundApis';
import { OutboundApis } from './components/OutboundApis';
import { EPaperHub } from './components/EPaperHub';
import { subscribeToApiFeeds } from './firebase/feedService';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [feeds, setFeeds] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // Subscribe to real-time feed updates (Firebase Firestore or Demo Store)
  useEffect(() => {
    const unsubscribe = subscribeToApiFeeds((updatedFeeds) => {
      setFeeds(updatedFeeds);
    });

    return () => unsubscribe();
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {activeTab === 'overview' && (
          <Overview feeds={feeds} onToast={triggerToast} />
        )}
        {activeTab === 'database' && (
          <DatabaseLogs feeds={feeds} onToast={triggerToast} />
        )}
        {activeTab === 'inbound' && (
          <InboundApis onToast={triggerToast} />
        )}
        {activeTab === 'outbound' && (
          <OutboundApis onToast={triggerToast} />
        )}
        {activeTab === 'epaper' && (
          <EPaperHub feeds={feeds} onToast={triggerToast} />
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="toast">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
