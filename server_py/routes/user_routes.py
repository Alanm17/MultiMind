from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..database import get_db
from ..auth import get_current_user_id
from ..services import user_service
from ..models import User

router = APIRouter()

@router.get("/me")
async def me(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    user = await user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": {"id": user.id, "email": user.email}}

@router.get("/by-email")
async def find_by_email(email: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "email": user.email}
