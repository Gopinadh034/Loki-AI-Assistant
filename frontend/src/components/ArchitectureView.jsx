import React, { useState } from 'react';
import { Layers, Box, Cpu, Mail, Server, Code, ArrowRight } from 'lucide-react';

export default function ArchitectureView() {
  const [selectedClass, setSelectedClass] = useState('engine');

  const classes = {
    engine: {
      title: 'LokiAssistantEngine',
      pattern: 'Orchestrator / Controller Pattern',
      file: 'backend/app/services/assistant.py',
      icon: <Box color="#10b981" size={24} />,
      desc: 'Central coordinator object linking Groq LLM natural language understanding with Brevo transactional email automation.',
      methods: [
        { name: 'process_request(ChatRequest) -> ChatResponse', purpose: 'Orchestrates intent parsing, email tool execution, timing, and response format' },
        { name: 'get_email_history() -> List[EmailLogEntry]', purpose: 'Delegates log retrieval to Brevo email service' }
      ],
      codeSnippet: `class LokiAssistantEngine:
    def __init__(self):
        self.email_service = BrevoEmailService()
        self.groq_service = GroqLLMService()

    def process_request(self, request: ChatRequest) -> ChatResponse:
        intent_info = self.groq_service.analyze_intent(request.message)
        if intent_info.intent == "SEND_EMAIL":
            # Triggers Brevo Automation
            status = self.email_service.send_email(payload)`
    },

    groq: {
      title: 'GroqLLMService',
      pattern: 'Service Wrapper / Adapter Pattern',
      file: 'backend/app/services/groq_service.py',
      icon: <Cpu color="#34d399" size={24} />,
      desc: 'Encapsulates Groq LLM API calls, enforcing JSON mode for structured intent recognition and conversational generation.',
      methods: [
        { name: 'analyze_intent(user_prompt) -> IntentStructure', purpose: 'Prompts Groq LLM to parse input into structured JSON intent' },
        { name: 'generate_chat_response(prompt, history) -> str', purpose: 'Generates Loki assistant responses using Llama 3.3 70B' },
        { name: 'generate_email_content(prompt, recipient) -> dict', purpose: 'Drafts subject & HTML body based on instructions' }
      ],
      codeSnippet: `class GroqLLMService:
    def analyze_intent(self, user_prompt: str) -> IntentStructure:
        client = self._get_client()
        res = client.chat.completions.create(
            model=self.model,
            messages=[...],
            response_format={"type": "json_object"}
        )
        return IntentStructure(**json.loads(res.content))`
    },

    email: {
      title: 'BrevoEmailService',
      pattern: 'Service Wrapper / Data Mapper',
      file: 'backend/app/services/email_service.py',
      icon: <Mail color="#f59e0b" size={24} />,
      desc: 'Manages transactional email dispatches via Brevo REST API v3, template wrapping, and memory log history.',
      methods: [
        { name: 'send_email(EmailAutomationPayload) -> dict', purpose: 'Posts payload to https://api.brevo.com/v3/smtp/email' },
        { name: 'get_logs() -> List[EmailLogEntry]', purpose: 'Returns historical email log list' }
      ],
      codeSnippet: `class BrevoEmailService:
    BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

    def send_email(self, payload: EmailAutomationPayload) -> dict:
        headers = {"api-key": self.api_key, "content-type": "application/json"}
        res = requests.post(self.BREVO_API_URL, json=..., headers=headers)`
    },

    config: {
      title: 'ConfigManager',
      pattern: 'Singleton Pattern',
      file: 'backend/app/config.py',
      icon: <Server color="#60a5fa" size={24} />,
      desc: 'Singleton configuration manager handling environment variables, API key validation, and runtime updates.',
      methods: [
        { name: 'update_keys(groq_key, brevo_key)', purpose: 'Dynamically updates active runtime API keys' },
        { name: 'is_groq_active() -> bool', purpose: 'Validates non-placeholder key state' }
      ],
      codeSnippet: `class ConfigManager:
    _instance = None
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance`
    }
  };

  const active = classes[selectedClass];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
      {/* Class Selector Panel */}
      <div className="glass-panel emerald-glow-box" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <Layers size={22} color="#10b981" />
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>OOP Architecture</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.keys(classes).map((key) => {
            const item = classes[key];
            const isSelected = selectedClass === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedClass(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  border: `1px solid ${isSelected ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                  color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                {item.icon}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{item.title}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{item.pattern}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Class Inspector Detail View */}
      <div className="glass-panel gold-glow-box" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {active.icon}
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{active.title}</h2>
            </div>
            <div style={{ fontSize: '12px', color: '#f59e0b', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              Design Pattern: {active.pattern}
            </div>
          </div>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: '6px' }}>
            {active.file}
          </div>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          {active.desc}
        </p>

        {/* Methods */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Code size={16} color="#10b981" />
            Class Methods & Responsibilities
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {active.methods.map((m, i) => (
              <div key={i} style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 14px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#34d399', fontWeight: 600 }}>
                  {m.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {m.purpose}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code Snippet */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: '#ffffff' }}>Implementation Snippet</h3>
          <pre className="json-box" style={{ fontSize: '12px', color: '#e6edf3' }}>
            {active.codeSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
}
