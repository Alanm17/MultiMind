from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from ..database import get_db
from ..services import user_service

router = APIRouter()

class AuthRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register(request: AuthRequest, db: AsyncSession = Depends(get_db)):
    try:
        user = await user_service.register_user(db, request.email, request.password)
        # Note: Node.js version returns token on register too, let's login to return it
        auth_data = await user_service.login_user(db, request.email, request.password)
        return {"token": auth_data["token"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(request: AuthRequest, db: AsyncSession = Depends(get_db)):
    try:
        auth_data = await user_service.login_user(db, request.email, request.password)
        return {"token": auth_data["token"]}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
