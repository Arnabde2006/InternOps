"""In-memory sliding window rate limiter for endpoint requests."""

import time
from collections import defaultdict
from typing import Dict, List
from fastapi import HTTPException, Request, status
from app.core.config import settings


class InMemoryRateLimiter:
    """Tracks request timestamps per client and enforces rate limits."""

    def __init__(self, requests_per_minute: int = 10):
        self.requests_per_minute = requests_per_minute
        self.client_requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        window_start = now - 60.0

        # Filter out requests older than 1 minute
        self.client_requests[client_id] = [
            ts for ts in self.client_requests[client_id] if ts > window_start
        ]

        if len(self.client_requests[client_id]) >= self.requests_per_minute:
            return False

        self.client_requests[client_id].append(now)
        return True

    def reset(self):
        """Reset all tracked requests (useful for test isolation)."""
        self.client_requests.clear()


rate_limiter = InMemoryRateLimiter(requests_per_minute=settings.RATE_LIMIT_PER_MINUTE)


async def check_rate_limit(request: Request):
    """FastAPI dependency to enforce rate limits per client IP / auth token."""
    client_id = request.client.host if request.client else "unknown"

    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.startswith("Bearer "):
        client_id = auth_header.split(" ")[1]

    if not rate_limiter.is_allowed(client_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
        )
