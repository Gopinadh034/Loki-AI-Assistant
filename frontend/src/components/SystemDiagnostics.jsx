import React, { useState } from 'react';
import { Activity, Key, CheckCircle2, ShieldAlert, Save, Cpu, Mail, Server } from 'lucide-react';

export default function SystemDiagnostics({ API_BASE_URL, systemStatus, refreshSystemStatus }) {
  const [groqKeyInput, setGroqKeyInput] = useState('');
  const [brevoKeyInput, setBrevoKeyInput] = useState('');
  const [senderEmailInput, setSenderEmailInput] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState(null);

  const handleUpdateKeys = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groq_api_key: groqKeyInput || undefined,
          brevo_api_key: brevoKeyInput || undefined,
          sender_email: senderEmailInput || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUpdateMsg({ success: true, text: 'System configuration and API keys updated!' });
        refreshSystemStatus();
        setGroqKeyInput('');
        setBrevoKeyInput('');
      } else {
        setUpdateMsg({ success: false, text: 'Failed to update keys' });
      }
    } catch (err) {
      setUpdateMsg({ success: false, text: err.message });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Active System Status Summary */}
      <div className="glass-panel emerald-glow-box" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <Activity size={22} color="#10b981" />
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>System Health & API Connection Status</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Groq Card */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Cpu size={24} color="#10b981" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Groq LLM Engine</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Model: {systemStatus?.default_model || 'llama-3.3-70b-versatile'}</div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              background: systemStatus?.groq_configured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: systemStatus?.groq_configured ? '#34d399' : '#fbbf24'
            }}>
              {systemStatus?.groq_configured ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
              <span>{systemStatus?.groq_configured ? 'LIVE API KEY' : 'SIMULATION MODE'}</span>
            </div>
          </div>

          {/* Brevo Card */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Mail size={24} color="#f59e0b" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Brevo Transactional Email API</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sender: {systemStatus?.sender_email || 'loki.assistant@example.com'}</div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              background: systemStatus?.brevo_configured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: systemStatus?.brevo_configured ? '#34d399' : '#fbbf24'
            }}>
              {systemStatus?.brevo_configured ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
              <span>{systemStatus?.brevo_configured ? 'LIVE API KEY' : 'SIMULATION MODE'}</span>
            </div>
          </div>

          {/* FastAPI Server Card */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Server size={24} color="#60a5fa" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>FastAPI Backend Service</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Running on Port 8000</div>
              </div>
            </div>
            <div style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-mono)', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              ONLINE
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px dashed var(--border-emerald)', borderRadius: '10px', padding: '14px', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          💡 <strong>Smart Fallback Engine</strong>: When running without live API keys, Loki automatically runs in <em>Interactive Simulation Mode</em> so all UI flows, intent analysis, email previews, and class methods can be tested without errors!
        </div>
      </div>

      {/* Dynamic Key Configuration Form */}
      <div className="glass-panel gold-glow-box" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <Key size={22} color="#f59e0b" />
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Runtime API Key Configuration</h3>
        </div>

        <form onSubmit={handleUpdateKeys} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Groq API Key (Optional Override)
            </label>
            <input
              type="password"
              className="chat-input"
              style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              placeholder="gsk_..."
              value={groqKeyInput}
              onChange={(e) => setGroqKeyInput(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Brevo API Key (Optional Override)
            </label>
            <input
              type="password"
              className="chat-input"
              style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
              placeholder="xkeysib-..."
              value={brevoKeyInput}
              onChange={(e) => setBrevoKeyInput(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Sender Email Address
            </label>
            <input
              type="email"
              className="chat-input"
              style={{ width: '100%' }}
              placeholder="loki.assistant@example.com"
              value={senderEmailInput}
              onChange={(e) => setSenderEmailInput(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={updating}
            className="send-btn"
            style={{ padding: '12px', justifyContent: 'center', fontSize: '14px', marginTop: '10px' }}
          >
            <Save size={16} />
            <span>{updating ? 'Saving Changes...' : 'Save & Update System Keys'}</span>
          </button>

          {updateMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              background: updateMsg.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: updateMsg.success ? '#34d399' : '#f87171',
              border: `1px solid ${updateMsg.success ? '#10b981' : '#ef4444'}`
            }}>
              {updateMsg.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
