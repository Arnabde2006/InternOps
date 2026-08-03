"""Input validation and sanitization for prompts and messages."""

from app.core.config import settings
from app.models.schemas import GenerateRequest


def extract_and_sanitize_prompt(request: GenerateRequest) -> str:
    """Extract and validate prompt from GenerateRequest.

    Raises:
        ValueError: If prompt is empty, missing, or exceeds maximum length.
    """
    raw_prompt = request.prompt or request.user_input

    if not raw_prompt and request.messages:
        # Extract from messages
        user_messages = [m for m in request.messages if m.role == "user"]
        if user_messages:
            raw_prompt = user_messages[-1].content
        else:
            raw_prompt = request.messages[-1].content

    if not raw_prompt or not raw_prompt.strip():
        raise ValueError("Prompt or valid messages are required and cannot be empty")

    prompt = raw_prompt.strip()

    if len(prompt) > settings.MAX_PROMPT_CHARS:
        raise ValueError(
            f"Prompt exceeds maximum length of {settings.MAX_PROMPT_CHARS} characters"
        )

    return prompt
