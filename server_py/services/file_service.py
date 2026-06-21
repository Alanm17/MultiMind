from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models import ProjectFile

async def get_files(db: AsyncSession, project_id: str):
    result = await db.execute(select(ProjectFile).where(ProjectFile.projectId == project_id))
    return result.scalars().all()

async def get_file(db: AsyncSession, project_id: str, file_path: str):
    result = await db.execute(
        select(ProjectFile).where(
            ProjectFile.projectId == project_id,
            ProjectFile.filePath == file_path,
            ProjectFile.isFolder == False
        )
    )
    return result.scalars().first()

async def create_file(db: AsyncSession, project_id: str, file_path: str, content: str, is_folder: bool = False, parent_id: str = None):
    file = ProjectFile(projectId=project_id, filePath=file_path, content=content, isFolder=is_folder, parentId=parent_id)
    db.add(file)
    await db.commit()
    await db.refresh(file)
    return file

async def update_file(db: AsyncSession, project_id: str, file_path: str, content: str):
    result = await db.execute(
        select(ProjectFile).where(
            ProjectFile.projectId == project_id,
            ProjectFile.filePath == file_path,
            ProjectFile.isFolder == False
        )
    )
    file = result.scalars().first()
    if file:
        file.content = content
        await db.commit()
        await db.refresh(file)
    return file

async def delete_file(db: AsyncSession, project_id: str, file_path: str):
    result = await db.execute(
        select(ProjectFile).where(
            ProjectFile.projectId == project_id,
            ProjectFile.filePath == file_path,
            ProjectFile.isFolder == False
        )
    )
    file = result.scalars().first()
    if file:
        await db.delete(file)
        await db.commit()
    return file

async def get_folder(db: AsyncSession, project_id: str, file_path: str):
    result = await db.execute(
        select(ProjectFile).where(
            ProjectFile.projectId == project_id,
            ProjectFile.filePath == file_path,
            ProjectFile.isFolder == True
        )
    )
    return result.scalars().first()

async def delete_folder(db: AsyncSession, project_id: str, file_path: str):
    result = await db.execute(
        select(ProjectFile).where(
            ProjectFile.projectId == project_id,
            ProjectFile.filePath.startswith(file_path)
        )
    )
    files = result.scalars().all()
    for file in files:
        await db.delete(file)
    await db.commit()
    return True
