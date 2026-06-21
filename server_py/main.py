import time
import logging
from contextlib import asynccontextmanager
from collections import defaultdict
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .database import engine, Base
from .config import settings
from .routes import (
    health_routes, auth_routes, user_routes, project_routes,
    session_routes, file_routes, memory_routes, agent_routes, chat_routes
)

# Import all models so Base.metadata knows about them
from . import models  # noqa: F401

# ── Logging ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO if settings.is_production else logging.DEBUG,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("multimind")

# ── Rate Limiter (in-memory, per-IP) ────────────────────
class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str) -> bool:
        now = time.time()
        window_start = now - self.window
        # Clean old entries
        self.requests[key] = [t for t in self.requests[key] if t > window_start]
        if len(self.requests[key]) >= self.max_requests:
            return False
        self.requests[key].append(now)
        return True

rate_limiter = RateLimiter(max_requests=settings.rate_limit_per_minute)

# ── Lifespan ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Validate production config
    settings.validate_production()
    # Create tables (idempotent)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables verified / created")
    logger.info(f"🚀 MultiMind API starting in {settings.environment} mode")
    yield
    await engine.dispose()
    logger.info("👋 MultiMind API shut down")

# ── App ──────────────────────────────────────────────────
app = FastAPI(
    title="MultiMind API",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,      # Hide Swagger in prod
    redoc_url="/redoc" if not settings.is_production else None,     # Hide ReDoc in prod
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Middleware: Rate Limiting ────────────────────────────
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for health checks
    if request.url.path == "/api/health/" or request.url.path == "/api/health":
        return await call_next(request)
    
    client_ip = request.client.host if request.client else "unknown"
    if not rate_limiter.is_allowed(client_ip):
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests. Please try again later."},
        )
    return await call_next(request)

# ── Middleware: Security Headers ─────────────────────────
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# ── Middleware: Request Logging ──────────────────────────
@app.middleware("http")
async def log_requests_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start) * 1000
    logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration_ms:.0f}ms)")
    return response

# ── Global Exception Handler ────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=not settings.is_production)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error" if settings.is_production else str(exc)
        },
    )

# ── Routes ───────────────────────────────────────────────
app.include_router(health_routes.router, prefix="/api/health", tags=["Health"])
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Auth"])
app.include_router(user_routes.router, prefix="/api/users", tags=["Users"])
app.include_router(project_routes.router, prefix="/api/projects", tags=["Projects"])
app.include_router(session_routes.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(file_routes.router, prefix="/api/files", tags=["Files"])
app.include_router(memory_routes.router, prefix="/api/memory", tags=["Memory"])
app.include_router(agent_routes.router, prefix="/api/agents", tags=["Agents"])
app.include_router(chat_routes.router, prefix="/api/chat", tags=["Chat"])
