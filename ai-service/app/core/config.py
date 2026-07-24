import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "meta/llama-3.2-3b-instruct")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

AI_SERVICE_HOST = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "8000"))

AI_PROVIDER_ORDER = os.getenv("AI_PROVIDER_ORDER", "nvidia").split(",")


def is_placeholder(value: str) -> bool:
    return not value or value.startswith("your-")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    PROJECT_NAME: str = "InternOps AI Service"
    API_V1_STR: str = "/api/v1"
    AI_PROVIDER_KEY: str = ""
    DEFAULT_MODEL: str = "gpt-4o-mini"


settings = Settings()
