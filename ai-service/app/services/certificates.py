import logging
from fastapi import HTTPException
from app.prompts.certificates import build_certificate_prompt
from app.providers.orchestrator import ai_orchestrator

logger = logging.getLogger(__name__)


async def generate_certificate_design(task: str):
    try:
        prompt = build_certificate_prompt(task)

        response = await ai_orchestrator.generate_text(prompt)

        return response

    except Exception:
        logger.exception("Failed to generate certificate design")
        raise HTTPException(
            status_code=502,
            detail="Failed to generate certificate design."
        )