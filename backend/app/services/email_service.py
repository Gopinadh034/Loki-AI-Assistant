import requests
import uuid
from typing import Dict, Any, List
from datetime import datetime
from app.config import config
from app.models.schemas import EmailAutomationPayload, EmailLogEntry

class BrevoEmailService:
    """
    Object-Oriented Service encapsulating Brevo Transactional Email API (v3).
    Handles dispatches, HTML template rendering, and history logs.
    """
    BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

    def __init__(self, api_key_override: str = None):
        self.api_key = api_key_override or config.brevo_api_key
        self.email_logs: List[EmailLogEntry] = []

    def send_email(self, payload: EmailAutomationPayload) -> Dict[str, Any]:
        """
        Sends an automated transactional email via Brevo REST API v3.
        If no active API key is set, performs a simulation with realistic status metadata.
        """
        sender_name = payload.sender_name or config.sender_name
        sender_email = config.sender_email

        log_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # HTML wrap for modern aesthetic presentation in recipients' inbox
        formatted_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #0d1117; color: #e6edf3; padding: 20px; }}
                .card {{ background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 24px; max-width: 600px; margin: 0 auto; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }}
                .header {{ border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }}
                .title {{ color: #10b981; font-size: 20px; font-weight: bold; font-family: monospace; }}
                .content {{ font-size: 15px; line-height: 1.6; color: #c9d1d9; white-space: pre-wrap; }}
                .footer {{ margin-top: 24px; font-size: 12px; color: #8b949e; text-align: center; border-top: 1px solid #30363d; padding-top: 12px; }}
                .badge {{ background-color: #059669; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="header">
                    <span class="title">⚡ LOKI AI ASSISTANT</span>
                    <span class="badge">Brevo Automated Dispatch</span>
                </div>
                <div class="content">
                    {payload.body}
                </div>
                <div class="footer">
                    Sent automatically by Loki AI Assistant System via Brevo API.<br/>
                    Confidential &amp; Automated Communication.
                </div>
            </div>
        </body>
        </html>
        """

        headers = {
            "accept": "application/json",
            "api-key": self.api_key,
            "content-type": "application/json"
        }

        request_body = {
            "sender": {
                "name": sender_name,
                "email": sender_email
            },
            "to": [
                {
                    "email": payload.recipient_email,
                    "name": payload.recipient_name or "Recipient"
                }
            ],
            "subject": payload.subject,
            "htmlContent": formatted_html
        }

        # Check if live Brevo API key is available
        is_live = bool(self.api_key and not self.api_key.startswith("xkeysib-demo"))

        if is_live:
            try:
                response = requests.post(self.BREVO_API_URL, json=request_body, headers=headers, timeout=10)
                if response.status_code in [200, 201, 202]:
                    data = response.json()
                    message_id = data.get("messageId", log_id)
                    
                    log_entry = EmailLogEntry(
                        id=message_id,
                        recipient_email=payload.recipient_email,
                        subject=payload.subject,
                        timestamp=timestamp,
                        status="DELIVERED",
                        mode="LIVE_BREVO",
                        preview_body=payload.body[:120] + ("..." if len(payload.body) > 120 else "")
                    )
                    self.email_logs.insert(0, log_entry)

                    return {
                        "success": True,
                        "status": "DELIVERED",
                        "message_id": message_id,
                        "mode": "LIVE_BREVO_API",
                        "details": f"Email successfully dispatched to {payload.recipient_email} via Brevo API."
                    }
                else:
                    err_msg = response.json().get("message", response.text)
                    return {
                        "success": False,
                        "status": "FAILED",
                        "error": err_msg,
                        "status_code": response.status_code
                    }
            except Exception as e:
                return {
                    "success": False,
                    "status": "ERROR",
                    "error": str(e)
                }

        # Dry-run / Simulation mode when testing without a live Brevo key
        log_entry = EmailLogEntry(
            id=f"sim_{log_id}",
            recipient_email=payload.recipient_email,
            subject=payload.subject,
            timestamp=timestamp,
            status="SIMULATED",
            mode="DEMO_PREVIEW",
            preview_body=payload.body[:120] + ("..." if len(payload.body) > 120 else "")
        )
        self.email_logs.insert(0, log_entry)

        return {
            "success": True,
            "status": "SIMULATED",
            "message_id": f"sim_{log_id}",
            "mode": "DEMO_MODE",
            "details": f"Email compiled and simulated for {payload.recipient_email}. (To dispatch live emails, add your Brevo API key to .env or settings!).",
            "preview_payload": {
                "sender": f"{sender_name} <{sender_email}>",
                "recipient": payload.recipient_email,
                "subject": payload.subject,
                "body_preview": payload.body
            }
        }

    def get_logs(self) -> List[EmailLogEntry]:
        """Return history of dispatched and simulated emails."""
        return self.email_logs
