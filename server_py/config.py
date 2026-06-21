import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    port: int = Field(default=4000, alias="PORT")
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    jwt_secret: str = Field(default="dev_secret_change_in_production", alias="JWT_SECRET")
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:password@db.your-project.supabase.co:5432/postgres",
        alias="DATABASE_URL"
    )
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
