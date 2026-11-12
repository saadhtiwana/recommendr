"""Application settings, read only from environment variables (documented in ../../.env.example)."""

from functools import lru_cache
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # No env_file on purpose: config comes from the process environment only, so Render
    # and local dev (`uv run --env-file .env ...`) load config the same way.
    model_config = SettingsConfigDict(case_sensitive=False, extra="ignore")

    app_env: Literal["development", "test", "preview", "production"] = "development"
    log_level: str = "INFO"

    # Neon: the pooled URL (PgBouncer, transaction mode) serves the API; workers, the
    # scheduler and migrations use the direct URL because they hold sessions and locks.
    database_url: SecretStr | None = None
    database_url_direct: SecretStr | None = None

    session_secret: SecretStr | None = None
    cookie_domain: str | None = None
    cors_allowed_origins: list[str] = ["http://localhost:3000"]

    sentry_dsn: SecretStr | None = None


@lru_cache
def get_settings() -> Settings:
    """Cached so every Depends(get_settings) shares one parsed instance; tests override it."""
    return Settings()
