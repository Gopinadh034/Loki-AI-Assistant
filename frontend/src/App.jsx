import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import EmailStudio from './components/EmailStudio';
import SystemDiagnostics from './components/SystemDiagnostics';
import ArchitectureView from './components/ArchitectureView';
import './App.css';

const API_BASE_URL = 'http://localhost:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [systemStatus, setSystemStatus] = useState(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/status`);
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (e) {
      console.warn('Backend server not reachable yet:', e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
      />

      <main className="main-content">
        {activeTab === 'chat' && (
          <ChatInterface API_BASE_URL={API_BASE_URL} refreshSystemStatus={fetchStatus} />
        )}

        {activeTab === 'email' && (
          <EmailStudio API_BASE_URL={API_BASE_URL} />
        )}

        {activeTab === 'diagnostics' && (
          <SystemDiagnostics
            API_BASE_URL={API_BASE_URL}
            systemStatus={systemStatus}
            refreshSystemStatus={fetchStatus}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureView />
        )}
      </main>
    </div>
  );
}
