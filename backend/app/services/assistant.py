import time
from typing import Dict, Any, List
from app.config import config
from app.models.schemas import ChatRequest, ChatResponse, EmailAutomationPayload, IntentStructure
from app.services.groq_service import GroqLLMService
from app.services.email_service import BrevoEmailService
from app.services.vector_service import VectorDBService

class LokiAssistantEngine:
    """
    Main Orchestrator / Controller Class for Loki AI Assistant (OOP Design Pattern).
    Coordinates NLU intent parsing (Groq LLM), Email Automation (Brevo API),
    Vector Store Semantic Search (VectorDB RAG Engine), and conversational context.
    """
    def __init__(self):
        self.email_service = BrevoEmailService()
        self.groq_service = GroqLLMService()
        self.vector_service = VectorDBService()

    def process_request(self, request: ChatRequest) -> ChatResponse:
        """
        Processes a user's natural language request end-to-end:
        1. Queries Vector Database for RAG context (if enabled)
        2. Analyzes intent via Groq LLM (Structured JSON)
        3. Executes corresponding tool actions (e.g. Brevo email automation)
        4. Generates articulately formatted Loki response
        """
        start_time = time.time()

        # Instantiates services with optional runtime key overrides
        groq = GroqLLMService(api_key_override=request.groq_key_override)
        email_svc = BrevoEmailService(api_key_override=request.brevo_key_override)

        # 1. RAG Vector Retrieval
        rag_context = None
        if request.enable_rag:
            try:
                rag_context = self.vector_service.search_similar(request.message, top_k=3)
            except Exception as e:
                print(f"Vector search warning: {e}")

        # 2. Intent Analysis using Groq LLM
        intent_info: IntentStructure = groq.analyze_intent(request.message)

        action_taken = None
        email_status = None
        response_text = ""

        # 3. Execution Logic based on parsed Intent
        if intent_info.intent in ["SEND_EMAIL", "DRAFT_EMAIL"]:
            params = intent_info.parameters
            recipient_email = params.get("recipient_email") or "recipient@example.com"
            subject = params.get("subject") or f"Automated Communication from Loki AI"
            body = params.get("email_body") or params.get("topic") or request.message

            # Draft content if body is brief
            if len(body.strip()) < 30 or intent_info.intent == "DRAFT_EMAIL":
                drafted = groq.generate_email_content(prompt=body, recipient=recipient_email)
                subject = drafted["subject"]
                body = drafted["body"]

            if intent_info.intent == "SEND_EMAIL":
                payload = EmailAutomationPayload(
                    recipient_email=recipient_email,
                    subject=subject,
                    body=body
                )
                email_status = email_svc.send_email(payload)
                action_taken = f"Dispatched email to {recipient_email} via Brevo API ({email_status.get('status')})"
                
                response_text = (
                    f"⚡ **Loki Email Automation Executed**\n\n"
                    f"• **Recipient**: `{recipient_email}`\n"
                    f"• **Subject**: *{subject}*\n"
                    f"• **Status**: `{email_status.get('status')}` ({email_status.get('mode')})\n\n"
                    f"**Message Preview:**\n> {body[:250]}..."
                )
            else:
                action_taken = "Drafted email preview"
                email_status = {
                    "status": "DRAFTED",
                    "preview": {"subject": subject, "body": body, "recipient": recipient_email}
                }
                response_text = (
                    f"📝 **Loki AI Email Draft Prepared**\n\n"
                    f"• **Suggested Subject**: *{subject}*\n"
                    f"• **Target Recipient**: `{recipient_email}`\n\n"
                    f"**Body Draft:**\n{body}\n\n"
                    f"*Would you like me to send this email via Brevo API? Simply type 'Send this email to {recipient_email}'!*"
                )

        elif intent_info.intent == "SUMMARIZE":
            action_taken = "Generated structured summary"
            summary_prompt = f"Provide a clean, bulleted executive summary of the following:\n{request.message}"
            response_text = groq.generate_chat_response(summary_prompt, rag_context=rag_context)

        elif intent_info.intent == "SYSTEM_DIAGNOSTIC":
            action_taken = "Evaluated system status"
            sys_info = config.get_status()
            vector_stats = self.vector_service.get_stats()
            response_text = (
                f"🛡️ **Loki Core System Diagnostic**\n\n"
                f"• **Groq LLM Engine**: `{'ACTIVE (Live Key)' if sys_info['groq_configured'] else 'SIMULATION MODE'}`\n"
                f"• **Brevo Email API**: `{'ACTIVE (Live Key)' if sys_info['brevo_configured'] else 'SIMULATION MODE'}`\n"
                f"• **Vector DB Store**: `{vector_stats['engine']}` ({vector_stats['total_vector_chunks']} chunks stored)\n"
                f"• **Model Selected**: `{config.default_model}`\n"
                f"• **OOP Architecture**: `GroqLLMService` | `BrevoEmailService` | `VectorDBService` | `LokiAssistantEngine` active."
            )
        else:
            action_taken = f"Processed conversational query {'(RAG Context Injected)' if rag_context else ''}"
            history_dicts = [h.model_dump() for h in request.conversation_history] if request.conversation_history else []
            response_text = groq.generate_chat_response(request.message, history=history_dicts, intent_info=intent_info, rag_context=rag_context)

        elapsed_ms = round((time.time() - start_time) * 1000, 2)

        return ChatResponse(
            response=response_text,
            intent_data=intent_info,
            action_taken=action_taken,
            email_status=email_status,
            rag_context=rag_context,
            execution_time_ms=elapsed_ms,
            model_used=config.default_model if config.is_groq_active() else f"{config.default_model} (Simulation)"
        )

    def get_email_history(self) -> List[Any]:
        """Fetch email log history from Brevo service."""
        return self.email_service.get_logs()
