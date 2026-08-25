import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Clock, CheckCircle2, AlertCircle, Code, ShieldCheck, Mail } from 'lucide-react';

export default function ChatInterface({ API_BASE_URL, refreshSystemStatus }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "⚡ **Greetings! I am Loki AI Assistant.**\n\nI am engineered with **FastAPI**, **Groq LLM**, and **Brevo Email Automation** under modular **Object-Oriented Programming (OOP)**.\n\nHow may I assist you today? You can ask me to draft or send an email, summarize content, or run diagnostics!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastIntentData, setLastIntentData] = useState(null);
  const [lastResponseMeta, setLastResponseMeta] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    "Send welcome email to client@example.com with project updates",
    "Draft a professional meeting recap email for recipient ceo@techcorp.io",
    "Summarize key features of Loki AI Assistant",
    "Run system diagnostic check on Groq and Brevo APIs"
  ];

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversation_history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action_taken: data.action_taken,
        email_status: data.email_status
      };

      setMessages(prev => [...prev, assistantMsg]);
      setLastIntentData(data.intent_data);
      setLastResponseMeta({
        execution_time_ms: data.execution_time_ms,
        model_used: data.model_used,
        action_taken: data.action_taken
      });

      refreshSystemStatus();

    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Connection Error**: Unable to reach Loki FastAPI Backend. Please make sure backend server is running.\n\n*Error details: ${err.message}*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-layout">
      {/* Main Chat Hub Window */}
      <div className="glass-panel chat-card emerald-glow-box">
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="#10b981" />
            <span style={{ fontWeight: 700, fontSize: '16px' }}>Loki Neural Command Center</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Groq NLU • Brevo SMTP Pipeline
          </div>
        </div>

        {/* Message Stream */}
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message-item ${msg.role}`}>
              <div className={`avatar ${msg.role === 'user' ? 'user-avatar' : 'assistant-avatar'}`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={20} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="message-content">
                  {msg.content}
                </div>

                {msg.action_taken && (
                  <div style={{
                    fontSize: '11px',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '2px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    <CheckCircle2 size={12} />
                    <span>Action: {msg.action_taken}</span>
                  </div>
                )}

                <div style={{ fontSize: '10px', color: 'var(--text-dim)', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-item assistant">
              <div className="avatar assistant-avatar pulse-glow">
                <Bot size={20} />
              </div>
              <div className="message-content" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399' }}>
                <Sparkles size={16} className="pulse-glow" />
                <span>Loki is analyzing intent with Groq LLM & preparing execution...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts & Input Control */}
        <div className="chat-input-area">
          <div className="quick-prompts">
            {quickPrompts.map((promptText, idx) => (
              <button
                key={idx}
                className="prompt-chip"
                onClick={() => handleSendMessage(promptText)}
              >
                + {promptText}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="input-box-wrapper"
          >
            <input
              type="text"
              className="chat-input"
              placeholder="Ask Loki to send an email, summarize, or chat..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="send-btn" disabled={loading || !input.trim()}>
              <Send size={16} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar: AI Intent & Metadata Inspector */}
      <div className="sidebar-panel">
        {/* Real-time Intent Recognition Card */}
        <div className="glass-panel inspector-card emerald-glow-box">
          <div className="section-title">
            <Code size={18} color="#10b981" />
            <span>Groq NLU Intent Inspector</span>
          </div>

          {lastIntentData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Parsed Intent:</span>
                <span className="intent-badge">{lastIntentData.intent}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Confidence Score:</span>
                <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {(lastIntentData.confidence * 100).toFixed(0)}%
                </span>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                Reasoning: "{lastIntentData.reasoning}"
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Extracted Parameters:</div>
                <pre className="json-box">
                  {JSON.stringify(lastIntentData.parameters, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Send a message to see Loki's Groq LLM structured JSON intent analysis in real-time.
            </div>
          )}
        </div>

        {/* System Latency & Performance Metrics */}
        <div className="glass-panel inspector-card gold-glow-box">
          <div className="section-title">
            <Clock size={18} color="#f59e0b" />
            <span>Execution Performance</span>
          </div>

          {lastResponseMeta ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Latency:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#34d399', fontWeight: 600 }}>
                  {lastResponseMeta.execution_time_ms} ms
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Engine Model:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: '#fbbf24', fontSize: '11px' }}>
                  {lastResponseMeta.model_used}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Latency metrics will populate after message execution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
