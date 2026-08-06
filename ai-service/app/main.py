from fastapi import FastAPI

from app.api.ai_routes import router as ai_router
from app.api.v1.endpoints.health import router as health_router
from app.core.config import settings

# Initialize FastAPI app with project settings
app = FastAPI(title=settings.PROJECT_NAME)

# Routers
app.include_router(ai_router)
app.include_router(health_router)

# Root + Health endpoints
@app.get("/")
async def root():
    return {"message": "InternOps AI Service is running!"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


print("main.py loaded")
