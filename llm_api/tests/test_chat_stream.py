from __future__ import annotations

from fastapi.testclient import TestClient

from app import main


async def _fake_stream():
    yield {"choices": [{"delta": {"content": "你"}}]}
    yield {"choices": [{"delta": {"content": "好"}}]}


async def _fake_acompletion(**kwargs):
    return _fake_stream()


def test_chat_streaming_success(monkeypatch):
    monkeypatch.setenv("MODEL_NAME", "fake-model")
    monkeypatch.setattr(main, "acompletion", _fake_acompletion)

    client = TestClient(main.app)
    with client.stream(
        "POST",
        "/api/chat",
        json={"messages": [{"role": "user", "content": "你好"}]}
    ) as response:
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/plain")
        body = "".join(response.iter_text())

    assert body == "你好"


def test_chat_requires_model_name(monkeypatch):
    monkeypatch.delenv("MODEL_NAME", raising=False)

    client = TestClient(main.app)
    response = client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": "你好"}]}
    )

    assert response.status_code == 500
    assert response.json()["detail"] == "MODEL_NAME is not configured"
