from __future__ import annotations

import os
from dataclasses import dataclass


def _parse_origins(raw: str | None) -> list[str]:
    if not raw:
        return ["http://localhost:3000"]

    return [origin.strip() for origin in raw.split(",") if origin.strip()]


@dataclass(frozen=True)
class Settings:
    model_name: str
    api_base: str
    llm_provider: str
    cors_allow_origins: list[str]


def get_settings() -> Settings:
    return Settings(
        model_name=os.getenv("MODEL_NAME", "").strip(),
        api_base=os.getenv("LITELLM_API_BASE", "").strip(),
        llm_provider=os.getenv("LITELLM_PROVIDER", "openai").strip() or "openai",
        cors_allow_origins=_parse_origins(os.getenv("CORS_ALLOW_ORIGINS"))
    )
