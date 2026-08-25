import os
from typing import Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ConfigManager:
    """
    Object-Oriented Configuration Manager (Singleton Pattern)
    Handles loading, validation, and retrieval of system environment variables.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ConfigManager, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY", "")
        self.brevo_api_key = os.getenv("BREVO_API_KEY", "")
        self.sender_email = os.getenv("SENDER_EMAIL", "loki.assistant@example.com")
        self.sender_name = os.getenv("SENDER_NAME", "Loki AI Assistant")
        self.default_model = os.getenv("DEFAULT_MODEL", "llama-3.3-70b-versatile")
        self.port = int(os.getenv("PORT", 8000))

    def update_keys(self, groq_key: str = None, brevo_key: str = None, sender_email: str = None):
        """Update runtime API keys dynamically from requests or UI setting."""
        if groq_key is not None:
            self.groq_api_key = groq_key.strip()
        if brevo_key is not None:
            self.brevo_api_key = brevo_key.strip()
        if sender_email is not None:
            self.sender_email = sender_email.strip()

    def is_groq_active(self) -> bool:
        """Check if a valid non-placeholder Groq API key is present."""
        return bool(self.groq_api_key and not self.groq_api_key.startswith("gsk_demo_key"))

    def is_brevo_active(self) -> bool:
        """Check if a valid non-placeholder Brevo API key is present."""
        return bool(self.brevo_api_key and not self.brevo_api_key.startswith("xkeysib-demo"))

    def get_status(self) -> Dict[str, Any]:
        """Return system configuration status summary."""
        return {
            "groq_configured": self.is_groq_active(),
            "brevo_configured": self.is_brevo_active(),
            "sender_email": self.sender_email,
            "sender_name": self.sender_name,
            "default_model": self.default_model,
            "mode": "Live Production" if (self.is_groq_active() or self.is_brevo_active()) else "Interactive Simulation"
        }

# Global singleton instance export
config = ConfigManager()
