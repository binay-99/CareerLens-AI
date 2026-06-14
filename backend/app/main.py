from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .api.v1 import chat, assessment, portfolio, roadmap
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    print(f"Starting Career Lens AI Career Counselor Backend in environment: {settings.environment}")
    # Initialize vector store indexing on startup
    from .services.vector_store import VectorStoreService
    vs = VectorStoreService()
    print(f"Loaded {len(vs.roles)} career roles into memory database successfully.")
    
    yield
    print("Shutting down Career Lens AI Career Counselor Backend...")

app = FastAPI(
    title="Career Lens AI Career Counselor API",
    description="Backend API platform providing skill gap parsing, agent counseling, and roadmap generation.",
    version="1.0.0",
    lifespan=lifespan
)

settings = get_settings()

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api/v1", tags=["Chat"])
app.include_router(assessment.router, prefix="/api/v1", tags=["Assessment"])
app.include_router(portfolio.router, prefix="/api/v1", tags=["Portfolio"])
app.include_router(roadmap.router, prefix="/api/v1", tags=["Roadmap"])

@app.get("/")
async def root():
    return {
        "status": "online",
        "app": "Career Lens AI Career Counselor API",
        "mock_mode": settings.is_mock_enabled
    }
