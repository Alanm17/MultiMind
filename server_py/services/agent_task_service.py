from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models import AgentTask

async def create_agent_task(db: AsyncSession, project_id: str, agent_name: str, task_description: str, status: str):
    task = AgentTask(projectId=project_id, agentName=agent_name, taskDescription=task_description, status=status)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task

async def get_agent_tasks_by_project(db: AsyncSession, project_id: str):
    result = await db.execute(select(AgentTask).where(AgentTask.projectId == project_id))
    return result.scalars().all()

async def get_agent_task_by_id(db: AsyncSession, task_id: str):
    result = await db.execute(select(AgentTask).where(AgentTask.id == task_id))
    return result.scalars().first()

async def update_agent_task(db: AsyncSession, task_id: str, updates: dict):
    result = await db.execute(select(AgentTask).where(AgentTask.id == task_id))
    task = result.scalars().first()
    if task:
        for key, value in updates.items():
            setattr(task, key, value)
        await db.commit()
        await db.refresh(task)
    return task

async def delete_agent_task(db: AsyncSession, task_id: str):
    result = await db.execute(select(AgentTask).where(AgentTask.id == task_id))
    task = result.scalars().first()
    if task:
        await db.delete(task)
        await db.commit()
    return task
