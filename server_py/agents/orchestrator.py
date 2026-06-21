import asyncio
import re
from sqlalchemy.ext.asyncio import AsyncSession
from .registry import get_agent_config
from .api_client import api_client
from .context_manager import context_manager

async def extract_files_from_response(response: str):
    files = []
    # Simplified regex for file blocks like: ```language:path\ncontent\n```
    pattern = re.compile(r"```[a-zA-Z0-9_-]+:([^\n]+)\n(.*?)\n```", re.DOTALL)
    for match in pattern.finditer(response):
        path = match.group(1).strip()
        content = match.group(2).strip()
        files.append({"filePath": path, "content": content})
    return files

async def run_agents(db: AsyncSession, message: str, active_agents: list, chat_id: str, project_id: str):
    # Context
    project_context = await context_manager.get_context(db, project_id)
    ctx_string = context_manager.format_context_for_prompt(project_context)
    full_prompt = f"{ctx_string}\n\nUser Message: {message}"

    async def _run_agent(agent_name):
        config = get_agent_config(agent_name)
        if not config:
            return {"agentName": agent_name, "content": f"Error: Agent {agent_name} not found"}
        try:
            content = await api_client.call_agent(agent_name, config, full_prompt)
            files = await extract_files_from_response(content)
            # You would also save TraceLog and Files to DB here, simplified for now
            return {"agentName": agent_name, "content": content, "files": files}
        except Exception as e:
            return {"agentName": agent_name, "content": f"Error: {str(e)}", "files": []}

    results = await asyncio.gather(*[_run_agent(agent) for agent in active_agents])
    
    responses = []
    all_files = []
    for r in results:
        responses.append({"agentName": r["agentName"], "content": r["content"]})
        all_files.extend([{"agent": r["agentName"], **f} for f in r.get("files", [])])
        
    return {"responses": responses, "files": all_files}

async def run_agents_stream(db: AsyncSession, message: str, active_agents: list, chat_id: str, project_id: str):
    project_context = await context_manager.get_context(db, project_id)
    ctx_string = context_manager.format_context_for_prompt(project_context)
    full_prompt = f"{ctx_string}\n\nUser Message: {message}"

    # For streaming, we typically stream one agent or multiplex them.
    # We will just multiplex tokens with agent name tag if multiple, or stream directly if one.
    if len(active_agents) == 1:
        agent_name = active_agents[0]
        config = get_agent_config(agent_name)
        if config:
            async for token in api_client.call_agent_stream(agent_name, config, full_prompt):
                # Return JSON encoded string
                import json
                yield json.dumps({"agentName": agent_name, "token": token})
    else:
        # Complex multiplexing is hard via SSE, fallback to sequential or block for now
        # Placeholder for simplified sequential stream
        for agent_name in active_agents:
            config = get_agent_config(agent_name)
            if config:
                import json
                yield json.dumps({"agentName": agent_name, "token": f"\\n\\n**[{agent_name}]**\\n"})
                async for token in api_client.call_agent_stream(agent_name, config, full_prompt):
                    yield json.dumps({"agentName": agent_name, "token": token})

async def run_agent_workflow(db: AsyncSession, message: str, agent_chain: list, chat_id: str, project_id: str, context: list = None):
    responses = []
    current_prompt = message
    for agent_name in agent_chain:
        config = get_agent_config(agent_name)
        if config:
            content = await api_client.call_agent(agent_name, config, current_prompt, context)
            responses.append({"agentName": agent_name, "content": content})
            current_prompt += f"\n\nFrom {agent_name}:\n{content}"
    return {"responses": responses}
