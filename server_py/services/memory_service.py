import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models import MemorySummary

def sanitize_summary(summary: str) -> str:
    # Basic sanitization: remove script tags and trim
    return re.sub(r'<script.*?>.*?</script>', '', summary, flags=re.IGNORECASE).strip()

async def get_memory(db: AsyncSession, session_id: str):
    result = await db.execute(
        select(MemorySummary).where(MemorySummary.sessionId == session_id).order_by(MemorySummary.lastUpdated.desc())
    )
    return result.scalars().first()

async def update_memory(db: AsyncSession, session_id: str, summary: str):
    sanitized = sanitize_summary(summary)
    
    result = await db.execute(select(MemorySummary).where(MemorySummary.sessionId == session_id))
    memory = result.scalars().first()
    
    if memory:
        memory.summary = sanitized
    else:
        memory = MemorySummary(sessionId=session_id, summary=sanitized)
        db.add(memory)
        
    await db.commit()
    await db.refresh(memory)
    return memory
