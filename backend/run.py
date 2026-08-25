import uvicorn
import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(__file__))

if __name__ == "__main__":
    print("[LOKI SERVER] Starting Loki AI Assistant Backend on http://localhost:8000...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
