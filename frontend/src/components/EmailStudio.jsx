import React, { useState, useEffect } from 'react';
import { Mail, Send, Sparkles, History, CheckCircle2, AlertTriangle, RefreshCw, Eye } from 'lucide-react';

export default function EmailStudio({ API_BASE_URL }) {
  const [recipientEmail, setRecipientEmail] = useState('client@example.com');
  const [recipientName, setRecipientName] = useState('Valued Client');
  const [subject, setSubject] = useState('Project Progress & Milestone Update');
  const [body, setBody] = useState('Dear Valued Client,\n\nWe are pleased to inform you that the latest project milestones have been successfully completed.\n\nBest regards,\nLoki AI Assistant');
  const [prompt, setPrompt] = useState('Draft an enthusiastic email updating client on sprint release');
  const [tone, setTone] = useState('professional');

  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [previewModalLog, setPreviewModalLog] = useState(null);

  const fetchEmailLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/email-logs`);
      if (res.ok) {
        const logs = await res.json();
        setEmailLogs(logs);
      }
    } catch (e) {
      console.error('Failed to fetch logs:', e);
    }
  };

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  const handleDraftWithGroq = async () => {
    if (!prompt.trim()) return;
    setDrafting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/draft-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          tone
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSubject(data.subject);
        setBody(data.body);
      }
    } catch (e) {
      console.error('Drafting error:', e);
    } finally {
      setDrafting(false);
    }
  };

  const handleSendBrevoEmail = async () => {
    if (!recipientEmail || !subject || !body) return;
    setSending(true);
    setLastResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          subject: subject,
          body: body
        })
      });

      const data = await res.json();
      setLastResult(data);
      fetchEmailLogs();
    } catch (e) {
      setLastResult({ success: false, error: e.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Email Composer & Generator Panel */}
      <div className="glass-panel emerald-glow-box" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <Mail size={22} color="#10b981" />
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Brevo Email Automation Studio</h2>
        </div>

        {/* AI Drafting Tool Sub-box */}
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-gold)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#f59e0b', fontSize: '13px', fontWeight: 600 }}>
            <Sparkles size={16} />
            <span>Generate Draft with Groq LLM</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              className="chat-input"
              style={{ fontSize: '13px', padding: '8px 14px' }}
              placeholder="Describe email content..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              style={{ background: '#0f172a', border: '1px solid var(--border-subtle)', color: '#fff', padding: '0 12px', borderRadius: '8px', fontSize: '12px' }}
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="urgent">Urgent</option>
              <option value="concise">Concise</option>
            </select>
          </div>

          <button
            onClick={handleDraftWithGroq}
            disabled={drafting}
            style={{ width: '100%', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#fbbf24', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Sparkles size={14} />
            <span>{drafting ? 'Generating with Groq...' : 'Auto-Generate Subject & Body'}</span>
          </button>
        </div>

        {/* Email Fields Form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Recipient Email</label>
            <input
              type="email"
              className="chat-input"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Recipient Name</label>
            <input
              type="text"
              className="chat-input"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Subject Line</label>
          <input
            type="text"
            className="chat-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Body Content</label>
          <textarea
            className="chat-input"
            rows={5}
            style={{ width: '100%', resize: 'vertical' }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <button
          onClick={handleSendBrevoEmail}
          disabled={sending}
          className="send-btn"
          style={{ width: '100%', padding: '14px', justifyContent: 'center', fontSize: '15px' }}
        >
          <Send size={18} />
          <span>{sending ? 'Dispatching via Brevo API...' : 'Dispatch Email via Brevo API'}</span>
        </button>

        {/* Dispatch Result Box */}
        {lastResult && (
          <div style={{
            background: lastResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${lastResult.success ? '#10b981' : '#ef4444'}`,
            borderRadius: '10px',
            padding: '14px',
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: lastResult.success ? '#34d399' : '#f87171' }}>
              {lastResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>Status: {lastResult.status || (lastResult.success ? 'SUCCESS' : 'FAILED')}</span>
            </div>
            <div style={{ marginTop: '6px', color: 'var(--text-muted)' }}>{lastResult.details || lastResult.error}</div>
            {lastResult.message_id && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#fbbf24', marginTop: '4px' }}>
                Message ID: {lastResult.message_id}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Email Automation History Log */}
      <div className="glass-panel gold-glow-box" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={20} color="#f59e0b" />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Brevo Dispatch History</h3>
          </div>
          <button
            onClick={fetchEmailLogs}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px' }}>
          {emailLogs.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '13px' }}>
              No email logs found yet. Dispatch an email using the studio form or chat!
            </div>
          ) : (
            emailLogs.map((log, index) => (
              <div key={index} style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#ffffff' }}>{log.recipient_email}</span>
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: log.mode === 'LIVE_BREVO' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: log.mode === 'LIVE_BREVO' ? '#34d399' : '#fbbf24'
                  }}>
                    {log.mode}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 500 }}>
                  {log.subject}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  {log.preview_body}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>ID: {log.id}</span>
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
