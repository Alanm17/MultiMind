from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..services import session_service
from ..models import Project, ChatMessage, ProjectMemory, ChatSession

router = APIRouter()

class CreateSessionRequest(BaseModel):
    projectId: str
    name: str
    maxMessages: Optional[int] = 100
    maxTokens: Optional[int] = 3000

class RenameSessionRequest(BaseModel):
    name: str

class AddMessageRequest(BaseModel):
    sender: str
    content: str
    agentName: Optional[str] = None

@router.get("/")
async def get_sessions(projectId: str, db: AsyncSession = Depends(get_db)):
    if not projectId:
        raise HTTPException(status_code=400, detail="projectId required")
    sessions = await session_service.get_sessions(db, projectId)
    return [{"id": s.id, "projectId": s.projectId, "name": s.name, "createdAt": s.createdAt, "updatedAt": s.updatedAt, "maxMessages": s.maxMessages, "maxTokens": s.maxTokens} for s in sessions]

@router.get("/{session_id}/messages")
async def get_messages(session_id: str, db: AsyncSession = Depends(get_db)):
    messages = await session_service.get_messages(db, session_id)
    return [{"id": m.id, "sessionId": m.sessionId, "role": m.role, "content": m.content, "createdAt": m.createdAt} for m in messages]

@router.post("/")
async def create_session(request: CreateSessionRequest, db: AsyncSession = Depends(get_db)):
    if not request.projectId or not request.name.strip():
        raise HTTPException(status_code=400, detail="projectId and non-empty name required")
    
    result = await db.execute(select(Project).where(Project.id == request.projectId))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    session = await session_service.create_session(db, project.id, request.name, request.maxMessages, request.maxTokens)
    
    # Load prior memory
    prior_sessions_result = await db.execute(
        select(ChatSession)
        .where(ChatSession.projectId == project.id, ChatSession.id != session.id)
        .order_by(ChatSession.createdAt.asc())
    )
    prior_sessions = prior_sessions_result.scalars().all()
    # Eager loading would be better, but doing a manual fetch for memory summaries:
    all_summaries = []
    for s in prior_sessions:
        s_result = await db.execute(select(MemorySummary).where(MemorySummary.sessionId == s.id))
        s_memories = s_result.scalars().all()
        for m in s_memories:
            all_summaries.append(m.summary)
            
    pm_result = await db.execute(select(ProjectMemory).where(ProjectMemory.projectId == project.id))
    project_memories = pm_result.scalars().all()
    project_memory = {m.key: m.value for m in project_memories}
    
    return {
        "session": {"id": session.id, "name": session.name, "projectId": session.projectId},
        "priorMemorySummaries": all_summaries,
        "projectMemory": project_memory
    }

@router.delete("/{session_id}")
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    await session_service.delete_session(db, session_id)
    return {"success": True}

@router.post("/{session_id}/rename")
async def rename_session(session_id: str, request: RenameSessionRequest, db: AsyncSession = Depends(get_db)):
    if not request.name:
        raise HTTPException(status_code=400, detail="name required")
    session = await session_service.rename_session(db, session_id, request.name)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"id": session.id, "name": session.name, "projectId": session.projectId}

@router.post("/{session_id}/messages")
async def add_message(session_id: str, request: AddMessageRequest, db: AsyncSession = Depends(get_db)):
    if not request.sender or not request.content:
        raise HTTPException(status_code=400, detail="sender and content required")
    if request.sender not in ["user", "agent"]:
        raise HTTPException(status_code=400, detail="Invalid sender role")
        
    s_result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = s_result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    max_msgs = session.maxMessages or 100
    msg_result = await db.execute(select(ChatMessage).where(ChatMessage.sessionId == session_id))
    msg_count = len(msg_result.scalars().all())
    
    if msg_count >= max_msgs:
        raise HTTPException(status_code=400, detail=f"This chat has reached the maximum of {max_msgs} messages.")
        
    content = f"{request.agentName}: {request.content}" if request.agentName else request.content
    message = await session_service.add_message(db, session_id, request.sender, content)
    
    return {"id": message.id, "role": message.role, "content": message.content, "createdAt": message.createdAt}
