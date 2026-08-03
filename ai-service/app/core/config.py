"""Configuration settings for ai-service."""

import os


class Settings:
    """Application settings read from environment variables."""

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DEFAULT_PROVIDER: str = os.getenv("DEFAULT_PROVIDER", "gemini")

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("AI_CHAT_RATE_LIMIT_PER_MIN", "10"))

    # Max input character size
    MAX_PROMPT_CHARS: int = int(os.getenv("AI_MAX_PROMPT_CHARS", "2000"))
    MAX_TOTAL_CHARS: int = int(os.getenv("AI_MAX_TOTAL_CHARS", "32000"))


settings = Settings()
