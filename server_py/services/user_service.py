from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models import User
from ..auth import get_password_hash, verify_password, create_access_token

async def register_user(db: AsyncSession, email: str, password: str):
    result = await db.execute(select(User).where(User.email == email))
    existing = result.scalars().first()
    if existing:
        raise Exception("User already exists")
    
    password_hash = get_password_hash(password)
    new_user = User(email=email, passwordHash=password_hash)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

async def login_user(db: AsyncSession, email: str, password: str):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if not user:
        raise Exception("Invalid credentials")
    
    if not verify_password(password, user.passwordHash):
        raise Exception("Invalid credentials")
    
    token = create_access_token(data={"userId": user.id, "email": user.email})
    return {"user": user, "token": token}

async def get_user_by_id(db: AsyncSession, user_id: str):
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()
