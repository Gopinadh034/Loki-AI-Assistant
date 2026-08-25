from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of message sender: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Text content of the message")
    timestamp: Optional[str] = Field(default_factory=lambda: datetime.now().strftime("%H:%M:%S"))

class ChatRequest(BaseModel):
    message: str = Field(..., description="User's prompt or natural language instruction")
    conversation_history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation log")
    groq_key_override: Optional[str] = Field(default=None, description="Optional runtime Groq API key override")
    brevo_key_override: Optional[str] = Field(default=None, description="Optional runtime Brevo API key override")
    enable_rag: Optional[bool] = Field(default=True, description="Whether to perform RAG vector store retrieval")

class EmailAutomationPayload(BaseModel):
    recipient_email: str = Field(..., description="Destination email address")
    recipient_name: Optional[str] = Field(default="Valued User", description="Destination recipient name")
    subject: str = Field(..., description="Subject of the email")
    body: str = Field(..., description="HTML or Plain Text body of email")
    sender_name: Optional[str] = Field(default=None, description="Custom sender name")

class EmailDraftRequest(BaseModel):
    prompt: str = Field(..., description="Prompt describing the email to draft")
    recipient_email: str = Field(..., description="Recipient email address")
    recipient_name: Optional[str] = Field(default="Client", description="Recipient name")
    tone: Optional[str] = Field(default="professional", description="Email tone (professional, friendly, urgent, concise)")

class IntentStructure(BaseModel):
    intent: str = Field(..., description="Detected intent: 'CHAT', 'SEND_EMAIL', 'DRAFT_EMAIL', 'SUMMARIZE', 'SEARCH_VECTOR_DB', 'SYSTEM_DIAGNOSTIC'")
    confidence: float = Field(..., description="Confidence score between 0.0 and 1.0")
    parameters: Dict[str, Any] = Field(default={}, description="Extracted entity parameters")
    reasoning: str = Field(..., description="Explanation of why this intent was recognized")

class ChatResponse(BaseModel):
    response: str
    intent_data: IntentStructure
    action_taken: Optional[str] = None
    email_status: Optional[Dict[str, Any]] = None
    rag_context: Optional[List[Dict[str, Any]]] = None
    execution_time_ms: float
    model_used: str

class SystemConfigUpdate(BaseModel):
    groq_api_key: Optional[str] = None
    brevo_api_key: Optional[str] = None
    sender_email: Optional[str] = None

class EmailLogEntry(BaseModel):
    id: str
    recipient_email: str
    subject: str
    timestamp: str
    status: str
    mode: str
    preview_body: str

class VectorDocumentAdd(BaseModel):
    title: str = Field(..., description="Title or source of the document")
    text: str = Field(..., description="Content text to be embedded into Vector DB")
    category: Optional[str] = Field(default="General Knowledge", description="Document category tag")

class VectorSearchQuery(BaseModel):
    query: str = Field(..., description="Search query string")
    top_k: Optional[int] = Field(default=3, description="Number of top similar vector chunks to retrieve")
