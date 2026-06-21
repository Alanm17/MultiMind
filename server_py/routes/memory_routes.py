from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from ..database import get_db
from ..services import memory_service

router = APIRouter()

class MemoryUpdateRequest(BaseModel):
    summary: str

@router.get("/{session_id}")
async def get_memory(session_id: str, db: AsyncSession = Depends(get_db)):
    memory = await memory_service.get_memory(db, session_id)
    if memory:
        return {"summary": memory.summary}
    return {"summary": ""}

@router.post("/{session_id}")
async def update_memory(session_id: str, request: MemoryUpdateRequest, db: AsyncSession = Depends(get_db)):
    if not request.summary:
        raise HTTPException(status_code=400, detail="summary required")
    memory = await memory_service.update_memory(db, session_id, request.summary)
    return {"summary": memory.summary}
