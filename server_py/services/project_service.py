from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models import Project

async def create_project(db: AsyncSession, user_id: str, name: str):
    new_project = Project(userId=user_id, name=name)
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project

async def ensure_project(db: AsyncSession, project_id: str, name: str, user_id: str):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        project = Project(id=project_id, name=name or "Untitled Project", userId=user_id)
        db.add(project)
        await db.commit()
        await db.refresh(project)
    return project

async def get_projects_by_user(db: AsyncSession, user_id: str):
    result = await db.execute(select(Project).where(Project.userId == user_id))
    return result.scalars().all()

async def get_project_by_id(db: AsyncSession, project_id: str):
    result = await db.execute(select(Project).where(Project.id == project_id))
    return result.scalars().first()

async def update_project(db: AsyncSession, project_id: str, name: str):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().first()
    if project:
        project.name = name
        await db.commit()
        await db.refresh(project)
    return project

async def delete_project(db: AsyncSession, project_id: str):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().first()
    if project:
        await db.delete(project)
        await db.commit()
    return project
