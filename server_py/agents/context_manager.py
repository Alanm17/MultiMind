import json
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import ProjectMemory
from sqlalchemy.future import select

class ContextManager:
    async def get_context(self, db: AsyncSession, project_id: str):
        result = await db.execute(select(ProjectMemory).where(ProjectMemory.projectId == project_id))
        memories = result.scalars().all()
        return {m.key: m.value for m in memories}

    async def update_context(self, db: AsyncSession, project_id: str, key: str, value: str):
        result = await db.execute(select(ProjectMemory).where(ProjectMemory.projectId == project_id, ProjectMemory.key == key))
        memory = result.scalars().first()
        if memory:
            memory.value = value
        else:
            memory = ProjectMemory(projectId=project_id, key=key, value=value)
            db.add(memory)
        await db.commit()

    def format_context_for_prompt(self, context_dict: dict):
        if not context_dict:
            return ""
        ctx_str = "Project Context:\n"
        for k, v in context_dict.items():
            ctx_str += f"- {k}: {v}\n"
        return ctx_str
        
context_manager = ContextManager()
