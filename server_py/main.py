from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import health_routes, auth_routes, user_routes, project_routes, session_routes, file_routes, memory_routes, agent_routes, chat_routes

# Import all models so Base.metadata knows about them
from . import models  # noqa: F401

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (idempotent — won't drop existing)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables verified / created")
    yield
    # Cleanup on shutdown
    await engine.dispose()

app = FastAPI(title="MultiMind API", lifespan=lifespan)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Should be restricted in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_routes.router, prefix="/api/health", tags=["Health"])
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Auth"])
app.include_router(user_routes.router, prefix="/api/users", tags=["Users"])
app.include_router(project_routes.router, prefix="/api/projects", tags=["Projects"])
app.include_router(session_routes.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(file_routes.router, prefix="/api/files", tags=["Files"])
app.include_router(memory_routes.router, prefix="/api/memory", tags=["Memory"])
app.include_router(agent_routes.router, prefix="/api/agents", tags=["Agents"])
app.include_router(chat_routes.router, prefix="/api/chat", tags=["Chat"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server_py.main:app", host="0.0.0.0", port=4000, reload=True)
