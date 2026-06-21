import json
import asyncio
from google import genai
from google.genai import types
from ..config import settings

client = genai.Client(api_key=settings.gemini_api_key)

class GeminiAPIClient:
    def __init__(self):
        self.semaphore = asyncio.Semaphore(5)  # Limit concurrent requests

    async def call_agent(self, agent_name: str, config: dict, prompt: str, context: list = None):
        async with self.semaphore:
            # Build contents from context + prompt
            contents = []
            if context:
                for msg in context:
                    role = "user" if msg.get("role") == "user" else "model"
                    contents.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))
            contents.append(types.Content(role="user", parts=[types.Part(text=prompt)]))

            response = await client.aio.models.generate_content(
                model=config["model"],
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=config["systemMessage"],
                    max_output_tokens=config.get("maxTokens", 2048),
                    temperature=config.get("temperature", 0.7),
                )
            )
            return response.text

    async def call_agent_stream(self, agent_name: str, config: dict, prompt: str, context: list = None):
        async with self.semaphore:
            contents = []
            if context:
                for msg in context:
                    role = "user" if msg.get("role") == "user" else "model"
                    contents.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))
            contents.append(types.Content(role="user", parts=[types.Part(text=prompt)]))

            async for chunk in client.aio.models.generate_content_stream(
                model=config["model"],
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=config["systemMessage"],
                    max_output_tokens=config.get("maxTokens", 2048),
                    temperature=config.get("temperature", 0.7),
                )
            ):
                if chunk.text:
                    yield chunk.text

api_client = GeminiAPIClient()
