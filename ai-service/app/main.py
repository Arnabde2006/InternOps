"""Main FastAPI application entry point."""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from app.api.generate import router as generate_router
from app.providers.base import AIProviderError

app = FastAPI(
    title="AI Service",
    version="0.1.0",
    description="Microservice providing multi-provider AI text generation, caching, and failover.",
)

# Mount routes under root and under /api/v1 for compatibility
app.include_router(generate_router)
app.include_router(generate_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)},
    )


@app.exception_handler(AIProviderError)
async def ai_provider_error_handler(request: Request, exc: AIProviderError):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": str(exc)},
    )
