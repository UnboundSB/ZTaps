from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import uvicorn
from app.core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    print("Starting Z-TAPS Server...")
    from app.core.db import init_db
    init_db()
    print("Database initialized.")
    yield
    # Shutdown logic
    print("Shutting down Z-TAPS Server...")

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Z-TAPS (Zero-Trust Agentic Payment Sentinel)",
    description="Interception and validation layer for AI Agent payment requests.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "environment": settings.ENVIRONMENT if hasattr(settings, 'ENVIRONMENT') else 'unknown'}

from app.api.routes.agent import router as agent_router
from app.api.routes.webhooks import router as webhooks_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.demo import router as demo_router
from app.api.routes.admin import router as admin_router

app.include_router(agent_router)
app.include_router(webhooks_router)
app.include_router(dashboard_router)
app.include_router(demo_router)
app.include_router(admin_router, prefix="/api/v1/admin")

# Mount the static directory for the badass dashboard
import os
os.makedirs("static", exist_ok=True)
app.mount("/dashboard", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
