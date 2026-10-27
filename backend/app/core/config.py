from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "PulseCare Clinical Decision Support"
    environment: str = "development"
    debug: bool = True
    postgres_url: str = "postgresql+asyncpg://pulsecare:secret@postgres:5432/pulsecare"
    redis_url: str = "redis://redis:6379/0"
    demo_mode: bool = True
    secret_key: str = "dev-secret-key-change-me"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="PULSECARE_")


@lru_cache
def get_settings() -> Settings:
    return Settings()
