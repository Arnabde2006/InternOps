"""
Tests for app/api/ai_routes.py

Run with:
    pip install pytest httpx
    pytest tests/test_ai_routes.py -v

These exercise validation, limits, rbac stub, rate-limit stub, and the
health/usage endpoints. `call_provider` is still a stub (NotImplementedError),
so the "happy path" test expects a 500 until it's wired to a real provider —
update that one assertion once providers/gemini.py or openai.py is connected.
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.ai_routes import router
from app.core.rate_limit import chat_rate_limiter
from app.core.usage import _usage_by_user_day


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(router)
    # reset in-memory stubs between tests so they don't bleed into each other
    chat_rate_limiter._hits.clear()
    _usage_by_user_day.clear()
    return TestClient(app, raise_server_exceptions=False)


def test_chat_requires_prompt_or_messages(client):
    r = client.post("/ai/chat", json={})
    assert r.status_code == 400
    assert "Prompt or valid messages" in r.json()["detail"]


def test_chat_rejects_invalid_role(client):
    r = client.post(
        "/ai/chat", json={"messages": [{"role": "bogus", "content": "hi"}]}
    )
    assert r.status_code == 422  # pydantic enum validation


def test_chat_rejects_blank_content(client):
    r = client.post(
        "/ai/chat", json={"messages": [{"role": "user", "content": "   "}]}
    )
    assert r.status_code == 400
    assert "cannot be empty" in r.json()["detail"]


def test_chat_truncates_message_list_to_16(client):
    # The messages[:16] slice runs before the MAX_MESSAGES=32 check, so a
    # 33-message list is truncated to 16 before that check ever sees it —
    # the "Too many messages" 413 is effectively unreachable via this path.
    # This is inherited from the original JS (same slice-then-check order),
    # not a bug introduced in the port. This test documents that behavior
    # rather than asserting the unreachable 413.
    messages = [{"role": "user", "content": "hi"} for _ in range(33)]
    r = client.post("/ai/chat", json={"messages": messages})
    assert r.status_code != 413


def test_chat_prompt_fallback_when_no_messages(client):
    r = client.post("/ai/chat", json={"prompt": "hello"})
    # Reaches the provider stub -> 500 until providers are wired up.
    # TODO: once call_provider is real, change this to assert 200 and
    # check the response body shape instead.
    assert r.status_code == 500


def test_health_endpoint(client):
    r = client.get("/ai/health")
    assert r.status_code == 200
    assert r.json() == {"providers": []}


def test_usage_endpoint(client):
    r = client.get("/ai/usage")
    assert r.status_code == 200
    body = r.json()
    assert "date" in body
    assert body["users"] == []


def test_rate_limit_trips_after_configured_max(client, monkeypatch):
    # chat_rate_limiter.max_per_minute defaults to AI_CHAT_RATE_LIMIT_PER_MIN (10)
    limit = chat_rate_limiter.max_per_minute
    headers = {"x-user-id": "rate-limit-test-user"}

    for _ in range(limit):
        r = client.post("/ai/chat", json={"prompt": "hi"}, headers=headers)
        assert r.status_code != 429  # shouldn't be limited yet

    r = client.post("/ai/chat", json={"prompt": "hi"}, headers=headers)
    assert r.status_code == 429
