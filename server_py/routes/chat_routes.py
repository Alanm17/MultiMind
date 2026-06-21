import time
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional
from ..database import get_db
from ..agents.orchestrator import run_agents, run_agents_stream, run_agent_workflow

router = APIRouter()

class ChatRequest(BaseModel):
    chatId: str
    message: str
    activeAgents: List[str]
    projectId: str

class ChatStreamRequest(BaseModel):
    chatId: str
    message: str
    activeAgents: List[str]
    projectId: str

class WorkflowRequest(BaseModel):
    chatId: str
    message: str
    projectId: str
    context: Optional[list] = None

@router.post("/")
async def handle_chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    if not request.chatId or not request.projectId or not request.message or not request.activeAgents:
        raise HTTPException(status_code=400, detail="chatId, projectId, message, and activeAgents are required")

    try:
        result = await run_agents(
            db=db,
            message=request.message,
            active_agents=request.activeAgents,
            chat_id=request.chatId,
            project_id=request.projectId
        )
        return {
            "success": True,
            "messages": result.get("responses", []),
            "files": result.get("files", []),
            "metadata": {
                "chatId": request.chatId,
                "projectId": request.projectId,
                "activeAgents": request.activeAgents,
                "generatedFiles": len(result.get("files", []))
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stream")
async def handle_chat_stream(request: ChatStreamRequest, db: AsyncSession = Depends(get_db)):
    async def event_generator():
        try:
            async for token in run_agents_stream(
                db=db,
                message=request.message,
                active_agents=request.activeAgents,
                chat_id=request.chatId,
                project_id=request.projectId
            ):
                yield f"data: {token}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/workflow")
async def handle_workflow(request: WorkflowRequest, db: AsyncSession = Depends(get_db)):
    agent_chain = [
        "Coder Agent",
        "Tester Agent",
        "Reviewer Agent",
        "Documenter Agent",
        "DevOps Agent"
    ]
    try:
        result = await run_agent_workflow(
            db=db,
            message=request.message,
            agent_chain=agent_chain,
            chat_id=request.chatId,
            project_id=request.projectId,
            context=request.context
        )
        return {"success": True, "responses": result.get("responses", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
