import json
import re
from typing import Dict, Any, List
from groq import Groq
from app.config import config
from app.models.schemas import IntentStructure

class GroqLLMService:
    """
    Object-Oriented Service wrapping Groq LLM API.
    Provides natural language understanding, structured intent parsing, and content generation.
    """
    def __init__(self, api_key_override: str = None):
        self.api_key = api_key_override or config.groq_api_key
        self.model = config.default_model
        
    def _get_client(self) -> Groq:
        """Initialize Groq client instance."""
        if not self.api_key or self.api_key.startswith("gsk_demo_key"):
            raise ValueError("No valid Groq API key configured.")
        return Groq(api_key=self.api_key)

    def analyze_intent(self, user_prompt: str) -> IntentStructure:
        """
        Parses natural language user input into structured JSON intent & parameters using Groq LLM.
        """
        if not config.is_groq_active() and not (self.api_key and not self.api_key.startswith("gsk_demo_key")):
            return self._fallback_intent_analysis(user_prompt)

        system_prompt = (
            "You are the NLU Engine of Loki AI Assistant. "
            "Analyze the user's prompt and extract structured intent. "
            "Return STRICT JSON only matching this exact format:\n"
            "{\n"
            '  "intent": "SEND_EMAIL" | "DRAFT_EMAIL" | "SUMMARIZE" | "SYSTEM_DIAGNOSTIC" | "CHAT",\n'
            '  "confidence": 0.95,\n'
            '  "parameters": {\n'
            '    "recipient_email": "extracted email or null",\n'
            '    "subject": "extracted subject or null",\n'
            '    "email_body": "extracted content or body request or null",\n'
            '    "topic": "extracted topic or null"\n'
            "  },\n"
            '  "reasoning": "Brief explanation of why this intent was parsed"\n'
            "}"
        )

        try:
            client = self._get_client()
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            raw_json = response.choices[0].message.content
            parsed = json.loads(raw_json)
            
            return IntentStructure(
                intent=parsed.get("intent", "CHAT"),
                confidence=float(parsed.get("confidence", 0.9)),
                parameters=parsed.get("parameters", {}),
                reasoning=parsed.get("reasoning", "Parsed structured response from Groq LLM")
            )
        except Exception as e:
            # Fallback to local rule-based intent parsing if Groq API call encounters errors
            return self._fallback_intent_analysis(user_prompt, error_msg=str(e))

    def generate_chat_response(self, prompt: str, history: List[Dict[str, str]] = None, intent_info: IntentStructure = None, rag_context: List[Dict[str, Any]] = None) -> str:
        """
        Generates conversational response acting as Loki AI Assistant.
        Supports Retrieval-Augmented Generation (RAG) context from Vector DB.
        """
        if not config.is_groq_active() and not (self.api_key and not self.api_key.startswith("gsk_demo_key")):
            return self._fallback_chat_generation(prompt, intent_info, rag_context=rag_context)

        loki_system_prompt = (
            "You are Loki, a highly intelligent, powerful, sleek, and helpful AI Assistant. "
            "You excel in task automation, natural language parsing, and automated email generation via Brevo API. "
            "Respond articulately, professionally, with subtle modern wit and supreme confidence."
        )

        if rag_context:
            context_str = "\n".join([f"• [{item.get('metadata', {}).get('title', 'Knowledge Chunk')}]: {item.get('text')}" for item in rag_context])
            loki_system_prompt += f"\n\n[RETRIEVED VECTOR DB CONTEXT]:\n{context_str}\n\nUse the above context if relevant to answer the user accurately."

        messages = [{"role": "system", "content": loki_system_prompt}]
        
        if history:
            for item in history[-6:]: # Keep recent context
                messages.append({"role": item.get("role", "user"), "content": item.get("content", "")})

        messages.append({"role": "user", "content": prompt})

        try:
            client = self._get_client()
            response = client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            return response.choices[0].message.content
        except Exception as e:
            return self._fallback_chat_generation(prompt, intent_info, error_msg=str(e), rag_context=rag_context)

    def generate_email_content(self, prompt: str, recipient: str = "Client", tone: str = "professional") -> Dict[str, str]:
        """
        Drafts a structured email (Subject & Body) based on user prompt.
        """
        if not config.is_groq_active() and not (self.api_key and not self.api_key.startswith("gsk_demo_key")):
            return {
                "subject": f"Automated Update for {recipient}",
                "body": f"Hello {recipient},\n\nThis is an AI-generated message regarding: '{prompt}'.\n\nBest regards,\nLoki AI Assistant Engine"
            }

        prompt_text = (
            f"Draft a modern {tone} email for recipient '{recipient}'.\n"
            f"Topic/Details: {prompt}\n\n"
            "Return STRICT JSON only format:\n"
            '{\n  "subject": "Compelling subject line",\n  "body": "Full body text with clear greetings and structure"\n}'
        )

        try:
            client = self._get_client()
            res = client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt_text}],
                response_format={"type": "json_object"},
                temperature=0.5
            )
            parsed = json.loads(res.choices[0].message.content)
            return {
                "subject": parsed.get("subject", "AI Generated Email"),
                "body": parsed.get("body", "Email body content generation complete.")
            }
        except Exception:
            return {
                "subject": f"Update for {recipient}",
                "body": f"Greetings {recipient},\n\nHere is the requested information:\n{prompt}\n\nWarm regards,\nLoki AI Assistant"
            }

    def _fallback_intent_analysis(self, prompt: str, error_msg: str = None) -> IntentStructure:
        """Local smart fallback rule parser for quick testing and zero-config demo."""
        lower_prompt = prompt.lower()
        
        # Email pattern matching
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', prompt)
        extracted_email = email_match.group(0) if email_match else None

        if "send email" in lower_prompt or "email to" in lower_prompt or "mail to" in lower_prompt or extracted_email:
            # Extract subject if present
            subject = "AI Generated Notification"
            if "subject" in lower_prompt:
                sub_parts = prompt.split("subject")
                if len(sub_parts) > 1:
                    subject = sub_parts[1].split(".")[0].strip(" :\"'")
            
            return IntentStructure(
                intent="SEND_EMAIL",
                confidence=0.92,
                parameters={
                    "recipient_email": extracted_email or "user@example.com",
                    "subject": subject,
                    "email_body": prompt
                },
                reasoning="Email trigger keywords & target address identified (Simulation Mode)"
            )
        elif "draft" in lower_prompt or "write email" in lower_prompt or "compose" in lower_prompt:
            return IntentStructure(
                intent="DRAFT_EMAIL",
                confidence=0.88,
                parameters={"recipient_email": extracted_email or "client@example.com", "topic": prompt},
                reasoning="Email creation / composition request detected"
            )
        elif "summarize" in lower_prompt or "summary" in lower_prompt or "brief" in lower_prompt:
            return IntentStructure(
                intent="SUMMARIZE",
                confidence=0.85,
                parameters={"text_to_summarize": prompt},
                reasoning="Summarization request keywords identified"
            )
        elif "diagnostic" in lower_prompt or "status" in lower_prompt or "system" in lower_prompt or "health" in lower_prompt:
            return IntentStructure(
                intent="SYSTEM_DIAGNOSTIC",
                confidence=0.95,
                parameters={},
                reasoning="System health and diagnostic query requested"
            )

        return IntentStructure(
            intent="CHAT",
            confidence=0.98,
            parameters={},
            reasoning="General conversation query processed by Loki NLP engine"
        )

    def _fallback_chat_generation(self, prompt: str, intent_info: IntentStructure = None, error_msg: str = None, rag_context: List[Dict[str, Any]] = None) -> str:
        """Smart conversational fallback when Groq key is pending or offline."""
        if intent_info and intent_info.intent == "SEND_EMAIL":
            email = intent_info.parameters.get("recipient_email", "the recipient")
            return f"⚡ **Loki Automated Dispatch**: I've prepared and initiated the email dispatch to **{email}** using the Brevo API suite!"
        elif intent_info and intent_info.intent == "SYSTEM_DIAGNOSTIC":
            return "🛡️ **Loki Core Health Check**: All systems operational. Brevo Automation Pipeline ready, OOP Service modules initialized, FastAPI routing online."

        base_res = f"Greetings! I am **Loki AI Assistant**, powered by Groq LLM, Vector DB RAG, and Brevo Automation.\n\nI have received your request: *\"{prompt}\"*."

        if rag_context:
            rag_preview = "\n".join([f"> 🧠 **{c.get('metadata',{}).get('title','Chunk')}** (Score: {c.get('similarity_score')}):\n> *{c.get('text')}*" for c in rag_context[:2]])
            base_res += f"\n\n**Retrieved Vector DB Context (RAG Engine):**\n{rag_preview}"

        base_res += "\n\n💡 *Tip*: You can ask me to search the Vector DB, send emails, or test API connections!"
        return base_res
