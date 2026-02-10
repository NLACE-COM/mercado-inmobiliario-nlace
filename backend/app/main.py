from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import traceback
from contextlib import asynccontextmanager

# Import routers relatively or via app package
from .brain.router import router as brain_router
from .brain.admin_router import router as admin_router
from .brain.reports_router import router as reports_router
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize resources (e.g., DB connection, ML models)
    print("Backend Service Starting...")
    yield
    # Shutdown: Clean up resources
    print("Backend Service Shutting Down...")

app = FastAPI(
    title="NLACE Real Estate Intelligence API",
    description="Backend service for data processing, ETL, and AI insights.",
    version="0.1.0",
    lifespan=lifespan
)

# CORS (Open for deployment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"GLOBAL ERROR: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc().split("\n")[-3:]}
    )

app.include_router(brain_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(reports_router, prefix="/api")

@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "nlace-backend"}

@app.get("/api/debug")
async def debug_env():
    import os
    return {
        "supabase_url_set": bool(os.environ.get("SUPABASE_URL")),
        "supabase_key_set": bool(os.environ.get("SUPABASE_KEY")),
        "openai_key_set": bool(os.environ.get("OPENAI_API_KEY")),
        "env_keys": list(os.environ.keys())[:10] # First 10 keys for sanity check
    }

@app.get("/api/ping")
async def ping():
    return {"message": "pong", "env": "production"}

@app.get("/")
async def root():
    return {"message": "Welcome to NLACE Intelligence API"}
