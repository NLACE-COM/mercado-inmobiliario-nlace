from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.brain.router import router as brain_router
from app.brain.admin_router import router as admin_router
from app.brain.reports_router import router as reports_router
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

app.include_router(brain_router)
app.include_router(admin_router)
app.include_router(reports_router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "nlace-backend"}

@app.get("/")
async def root():
    return {"message": "Welcome to NLACE Intelligence API"}
