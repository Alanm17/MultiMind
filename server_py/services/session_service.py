from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models import ChatSession, ChatMessage, MemorySummary, ProjectMemory

async def get_sessions(db: AsyncSession, project_id: str):
    result = await db.execute(select(ChatSession).where(ChatSession.projectId == project_id).order_by(ChatSession.updatedAt.desc()))
    return result.scalars().all()

async def get_messages(db: AsyncSession, session_id: str):
    result = await db.execute(select(ChatMessage).where(ChatMessage.sessionId == session_id).order_by(ChatMessage.createdAt.asc()))
    return result.scalars().all()

async def create_session(db: AsyncSession, project_id: str, name: str, max_messages: int = 100, max_tokens: int = 3000):
    session = ChatSession(projectId=project_id, name=name, maxMessages=max_messages, maxTokens=max_tokens)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

async def delete_session(db: AsyncSession, session_id: str):
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = result.scalars().first()
    if session:
        await db.delete(session)
        await db.commit()
    return session

async def rename_session(db: AsyncSession, session_id: str, name: str):
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = result.scalars().first()
    if session:
        session.name = name
        await db.commit()
        await db.refresh(session)
    return session

async def add_message(db: AsyncSession, session_id: str, role: str, content: str):
    message = ChatMessage(sessionId=session_id, role=role, content=content)
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message
