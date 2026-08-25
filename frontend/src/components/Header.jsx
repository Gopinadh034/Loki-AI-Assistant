import React from 'react';
import { Bot, Mail, Cpu, Layers, Activity, Zap } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, systemStatus }) {
  const isGroqLive = systemStatus?.groq_configured;
  const isBrevoLive = systemStatus?.brevo_configured;

  return (
    <header className="navbar">
      <div className="brand-logo">
        <div className="logo-icon pulse-glow">
          <Zap size={24} />
        </div>
        <div>
          <div className="brand-title">LOKI AI ASSISTANT</div>
          <div className="brand-subtitle">Groq LLM • Brevo Email • FastAPI</div>
        </div>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <Bot size={16} />
          <span>AI Chat Hub</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          <Mail size={16} />
          <span>Email Automation Studio</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'diagnostics' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagnostics')}
        >
          <Activity size={16} />
          <span>System Diagnostics</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'architecture' ? 'active' : ''}`}
          onClick={() => setActiveTab('architecture')}
        >
          <Layers size={16} />
          <span>OOP Architecture</span>
        </button>
      </nav>

      <div className="status-pills">
        <div className="status-pill" title="Groq LLM Engine Status">
          <Cpu size={14} color="#10b981" />
          <span>Groq:</span>
          <span className={`status-dot ${isGroqLive ? 'active' : 'sim'}`}></span>
          <span>{isGroqLive ? 'LIVE' : 'DEMO'}</span>
        </div>

        <div className="status-pill" title="Brevo Email Automation Status">
          <Mail size={14} color="#f59e0b" />
          <span>Brevo:</span>
          <span className={`status-dot ${isBrevoLive ? 'active' : 'sim'}`}></span>
          <span>{isBrevoLive ? 'LIVE' : 'DEMO'}</span>
        </div>
      </div>
    </header>
  );
}
