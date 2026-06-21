import httpx
import json
import asyncio
from ..config import settings

class TogetherAPIClient:
    def __init__(self):
        self.api_key = settings.together_api_key
        self.base_url = "https://api.together.xyz/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        self.semaphore = asyncio.Semaphore(5) # limit concurrent requests

    async def call_agent(self, agent_name: str, config: dict, prompt: str, context: list = None):
        async with self.semaphore:
            messages = [
                {"role": "system", "content": config["systemMessage"]}
            ]
            if context:
                messages.extend(context)
            messages.append({"role": "user", "content": prompt})
            
            payload = {
                "model": config["model"],
                "messages": messages,
                "max_tokens": config.get("maxTokens", 2048),
                "temperature": config.get("temperature", 0.7),
                "stream": False
            }
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self.headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
                
    async def call_agent_stream(self, agent_name: str, config: dict, prompt: str, context: list = None):
        async with self.semaphore:
            messages = [
                {"role": "system", "content": config["systemMessage"]}
            ]
            if context:
                messages.extend(context)
            messages.append({"role": "user", "content": prompt})
            
            payload = {
                "model": config["model"],
                "messages": messages,
                "max_tokens": config.get("maxTokens", 2048),
                "temperature": config.get("temperature", 0.7),
                "stream": True
            }
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("POST", f"{self.base_url}/chat/completions", headers=self.headers, json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                break
                            try:
                                data = json.loads(data_str)
                                if data["choices"][0]["delta"].get("content"):
                                    yield data["choices"][0]["delta"]["content"]
                            except:
                                pass

api_client = TogetherAPIClient()
