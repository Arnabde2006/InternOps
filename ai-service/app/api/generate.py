"""API router for AI generation endpoints."""

import os
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.config import settings
from app.core.rate_limiter import check_rate_limit
from app.core.sanitizer import extract_and_sanitize_prompt
from app.models.schemas import GenerateRequest, GenerateResponse
from app.providers import (
    AIProviderError,
    GeminiProvider,
    OpenAIProvider,
    ProviderRateLimitError,
    ProviderTimeoutError,
)

router = APIRouter(tags=["AI Generate"])


def get_provider(provider_name: str):
    name = (provider_name or settings.DEFAULT_PROVIDER).lower()
    if name == "gemini":
        api_key = os.getenv("GEMINI_API_KEY", "test-gemini-key")
        return GeminiProvider(api_key=api_key)
    elif name == "openai":
        api_key = os.getenv("OPENAI_API_KEY", "test-openai-key")
        return OpenAIProvider(api_key=api_key)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported AI provider: {provider_name}",
        )


@router.post(
    "/generate",
    response_model=GenerateResponse,
    dependencies=[Depends(check_rate_limit)],
)
async def generate(request: GenerateRequest):
    """Generate AI response for the given prompt or messages."""
    try:
        prompt = extract_and_sanitize_prompt(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    provider = get_provider(request.provider or settings.DEFAULT_PROVIDER)

    try:
        content = await provider.generate_text(prompt)
        return GenerateResponse(
            provider=provider.provider_name,
            content=content,
            cached=False,
        )
    except ProviderRateLimitError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Provider rate limit exceeded: {e.message}",
        )
    except ProviderTimeoutError as e:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"Provider timeout: {e.message}",
        )
    except AIProviderError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service unavailable: {e.message}",
        )
