"""Pydantic schemas for request and response validation."""

from typing import List, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the message author ('user', 'assistant', 'system')")
    content: str = Field(..., min_length=1, description="Message text content")


class GenerateRequest(BaseModel):
    prompt: Optional[str] = Field(None, description="Prompt text")
    user_input: Optional[str] = Field(None, description="Alternative alias for prompt")
    messages: Optional[List[ChatMessage]] = Field(None, description="List of chat history messages")
    provider: Optional[str] = Field(None, description="Override AI provider (gemini, openai)")


class GenerateResponse(BaseModel):
    provider: str
    content: str
    cached: bool = False
