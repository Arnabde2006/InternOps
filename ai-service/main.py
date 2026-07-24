from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router
from app.core.config import AI_SERVICE_HOST, AI_SERVICE_PORT
import uvicorn

app = FastAPI(
    title="InternOps AI Service",
    description="Gemini-powered AI chatbot microservice for InternOps",
    version="1.0.0",
)

# Allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(chat_router)


@app.get("/")
async def root():
    return {"message": "InternOps AI Service is running", "docs": "/docs"}


if __name__ == "__main__":
    uvicorn.run("main:app", host=AI_SERVICE_HOST, port=AI_SERVICE_PORT, reload=True)
