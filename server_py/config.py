import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    port: int = Field(default=4000, alias="PORT")
    together_api_key: str = Field(default="your_together_api_key_here", alias="TOGETHER_API_KEY")
    jwt_secret: str = Field(default="dev_secret_change_in_production", alias="JWT_SECRET")
    database_url: str = Field(default="sqlite+aiosqlite:///../server/prisma/dev.db", alias="DATABASE_URL")
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
