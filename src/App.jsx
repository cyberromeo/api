import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { EPaperHub } from './components/EPaperHub';
import { Overview } from './components/Overview';
import { ApiFeed } from './components/ApiFeed';
import { EndpointRegistry } from './components/EndpointRegistry';
import { CronicleDocs } from './components/CronicleDocs';
import { subscribeToApiFeeds } from './firebase/feedService';

export default function App() {
  const [activeTab, setActiveTab] = useState('epaper');
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
        {activeTab === 'epaper' && (
          <EPaperHub feeds={feeds} onToast={triggerToast} />
        )}
        {activeTab === 'overview' && (
          <Overview feeds={feeds} onToast={triggerToast} />
        )}

        {activeTab === 'feed' && (
          <ApiFeed feeds={feeds} onToast={triggerToast} />
        )}
        {activeTab === 'registry' && (
          <EndpointRegistry onToast={triggerToast} />
        )}
        {activeTab === 'cronicle' && (
          <CronicleDocs onToast={triggerToast} />
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
