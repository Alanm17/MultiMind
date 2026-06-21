import io
import zipfile
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from ..database import get_db
from ..auth import get_current_user_id
from ..services import project_service
from ..models import Project, ProjectFile

router = APIRouter()

class ProjectCreateRequest(BaseModel):
    name: str

class ProjectUpdateRequest(BaseModel):
    name: str

@router.post("/")
async def create_project(request: ProjectCreateRequest, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    if not request.name.strip():
        raise HTTPException(status_code=400, detail="Project name required")
    # For now simply generate id internally or using ensure_project (with random uuid)
    import uuid
    project = await project_service.ensure_project(db, str(uuid.uuid4()), request.name, user_id)
    return {"project": {"id": project.id, "name": project.name, "userId": project.userId}}

@router.get("/")
async def list_projects(db: AsyncSession = Depends(get_db)):
    # Like Node.js: returns all projects without filtering
    result = await db.execute(select(Project))
    projects = result.scalars().all()
    return {"projects": [{"id": p.id, "name": p.name, "userId": p.userId} for p in projects]}

@router.get("/{project_id}")
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    project = await project_service.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"project": {"id": project.id, "name": project.name, "userId": project.userId}}

@router.put("/{project_id}")
async def update_project(project_id: str, request: ProjectUpdateRequest, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    project = await project_service.get_project_by_id(db, project_id)
    if not project or project.userId != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
    updated = await project_service.update_project(db, project_id, request.name)
    return {"project": {"id": updated.id, "name": updated.name, "userId": updated.userId}}

@router.delete("/{project_id}")
async def delete_project(project_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    project = await project_service.get_project_by_id(db, project_id)
    if not project or project.userId != user_id:
        raise HTTPException(status_code=404, detail="Project not found")
    await project_service.delete_project(db, project_id)
    return {"success": True}

@router.get("/{project_id}/download")
async def download_project_zip(project_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    project = await project_service.get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    result = await db.execute(select(ProjectFile).where(ProjectFile.projectId == project_id))
    files = result.scalars().all()
    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            zf.writestr(f.filePath, f.content)
            
    zip_buffer.seek(0)
    filename = f"{project.name or 'project'}.zip"
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
    )
    
# Missing model routes removed (addMember, listMembers, removeMember)
