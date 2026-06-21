from fastapi import APIRouter
from ..agents.registry import get_all_agents

router = APIRouter()

@router.get("/")
async def get_agents():
    agents = get_all_agents()
    return {"agents": agents}
