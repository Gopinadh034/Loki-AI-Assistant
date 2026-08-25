import os
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import config
from app.models.schemas import (
    ChatRequest, ChatResponse, EmailAutomationPayload,
    EmailDraftRequest, SystemConfigUpdate, VectorDocumentAdd, VectorSearchQuery
)
from app.services.assistant import LokiAssistantEngine
from app.services.email_service import BrevoEmailService
from app.services.groq_service import GroqLLMService
from app.services.vector_service import VectorDBService

# Initialize FastAPI application
app = FastAPI(
    title="Loki AI Assistant API",
    description="AI-powered assistant using Python, FastAPI, Groq LLM API, Brevo Email API, and Vector Database (ChromaDB RAG).",
    version="1.1.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Singleton Engine Instance
assistant_engine = LokiAssistantEngine()
vector_service = VectorDBService()

@app.get("/api/status")
async def get_system_status():
    """Get system health, API configuration, and Vector DB status."""
    sys_status = config.get_status()
    sys_status["vector_db"] = vector_service.get_stats()
    return sys_status

@app.post("/api/chat", response_model=ChatResponse)
async def process_chat(request: ChatRequest):
    """
    Main endpoint: Processes natural language instructions using Groq LLM JSON Intent parsing,
    queries ChromaDB Vector Store for RAG context, and triggers automated tools (Brevo Email).
    """
    try:
        return assistant_engine.process_request(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Loki Processing Error: {str(e)}"
        )

@app.post("/api/send-email")
async def send_direct_email(payload: EmailAutomationPayload):
    """Directly triggers Brevo Transactional Email automation."""
    try:
        email_svc = assistant_engine.email_service
        result = email_svc.send_email(payload)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Brevo Email Dispatch Error: {str(e)}"
        )

@app.post("/api/draft-email")
async def draft_email_content(request: EmailDraftRequest):
    """Uses Groq LLM to generate structured email subjects and bodies."""
    try:
        groq_svc = assistant_engine.groq_service
        drafted = groq_svc.generate_email_content(
            prompt=request.prompt,
            recipient=request.recipient_name or request.recipient_email,
            tone=request.tone or "professional"
        )
        return {
            "success": True,
            "recipient_email": request.recipient_email,
            "subject": drafted["subject"],
            "body": drafted["body"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email Generation Error: {str(e)}"
        )

@app.get("/api/email-logs")
async def get_email_logs():
    """Returns log history of sent/simulated emails."""
    return assistant_engine.get_email_history()

# --- VECTOR DATABASE & RAG ENDPOINTS ---
@app.post("/api/vector/add")
async def add_vector_document(doc: VectorDocumentAdd):
    """Embeds and indexes a document into the ChromaDB Vector Store."""
    try:
        res = vector_service.add_document(text=doc.text, title=doc.title, category=doc.category)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vector Indexing Error: {str(e)}"
        )

@app.post("/api/vector/search")
async def search_vector_database(query_req: VectorSearchQuery):
    """Performs cosine semantic similarity search over stored vectors."""
    try:
        results = vector_service.search_similar(query=query_req.query, top_k=query_req.top_k or 3)
        return {
            "query": query_req.query,
            "results_count": len(results),
            "matches": results
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vector Search Error: {str(e)}"
        )

@app.get("/api/vector/stats")
async def get_vector_stats():
    """Returns Vector DB collection stats and chunk counts."""
    return vector_service.get_stats()

@app.post("/api/settings")
async def update_settings(settings: SystemConfigUpdate):
    """Dynamically update Groq or Brevo API keys for live testing."""
    config.update_keys(
        groq_key=settings.groq_api_key,
        brevo_key=settings.brevo_api_key,
        sender_email=settings.sender_email
    )
    return {
        "success": True,
        "message": "Configuration updated successfully",
        "status": config.get_status()
    }

# Check if production build of React frontend exists to serve statically
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    async def root():
        return {
            "name": "Loki AI Assistant API",
            "status": "Online",
            "docs": "/docs",
            "config": config.get_status()
        }
