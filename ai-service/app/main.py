from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.investigate import router as investigate_router

app = FastAPI(
    title="ThreatLens AI Service",
    description="Multi-agent SOC investigation workflow",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(investigate_router)


@app.get("/health")
def health():
    has_llm = bool(settings.openai_api_key and settings.openai_api_key.startswith("sk-"))
    return {
        "status": "ok",
        "service": "threatlens-ai-service",
        "version": "0.2.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model": settings.model_name,
        "llmEnabled": has_llm,
    }
