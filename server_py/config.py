import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import List

class Settings(BaseSettings):
    # Server
    port: int = Field(default=4000, alias="PORT")
    environment: str = Field(default="development", alias="ENVIRONMENT")  # development | production
    debug: bool = Field(default=False, alias="DEBUG")
    
    # Auth
    jwt_secret: str = Field(default="", alias="JWT_SECRET")
    
    # AI
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    
    # Database
    database_url: str = Field(default="", alias="DATABASE_URL")
    db_pool_size: int = Field(default=5, alias="DB_POOL_SIZE")
    db_max_overflow: int = Field(default=10, alias="DB_MAX_OVERFLOW")
    
    # CORS — comma-separated origins, or "*" for dev
    cors_origins: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")
    
    # Rate limiting
    rate_limit_per_minute: int = Field(default=60, alias="RATE_LIMIT_PER_MINUTE")

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )
    
    @property
    def is_production(self) -> bool:
        return self.environment == "production"
    
    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]
    
    def validate_production(self):
        """Raise if critical secrets are missing or insecure."""
        if self.is_production:
            if not self.jwt_secret or self.jwt_secret == "dev_secret_change_in_production":
                raise ValueError("JWT_SECRET must be set to a strong secret in production")
            if not self.database_url:
                raise ValueError("DATABASE_URL must be set in production")
            if not self.gemini_api_key:
                raise ValueError("GEMINI_API_KEY must be set in production")
            if self.cors_origins == "*":
                raise ValueError("CORS_ORIGINS must not be '*' in production")

settings = Settings()
