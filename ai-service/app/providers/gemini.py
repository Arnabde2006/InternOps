import asyncio
from google import genai
from app.core.config import GEMINI_API_KEY, GEMINI_MODEL

MAX_MESSAGES = 32
MAX_MESSAGE_CHARS = 4000


def _build_prompt(messages: list[dict]) -> str:
    parts = []
    for msg in messages[:MAX_MESSAGES]:
        role = msg.get("role", "user")
        content = str(msg.get("content", ""))[:MAX_MESSAGE_CHARS]
        parts.append(f"{role.capitalize()}: {content}")
    return "\n".join(parts)


def _call_gemini_sync(prompt: str) -> str:
    """Blocking call to Gemini API — run this in a thread via asyncio.to_thread."""
    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )
    if not response.text:
        raise ValueError("Gemini returned an empty response")
    return response.text


async def call_gemini(messages: list[dict]) -> str:
    """
    Send messages to Gemini API using the new google-genai SDK (v2).
    Uses asyncio.to_thread so the blocking SDK call doesn't block the event loop.
    """
    prompt = _build_prompt(messages)
    return await asyncio.to_thread(_call_gemini_sync, prompt)
