from __future__ import annotations

from typing import Any, AsyncIterator

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from litellm import acompletion

from app.schemas import ChatRequest
from app.settings import get_settings

load_dotenv()

app = FastAPI(title="Login System LLM API", version="1.0.0")
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


def _extract_text_from_chunk(chunk: Any) -> str:
    if isinstance(chunk, dict):
        choices = chunk.get("choices") or []
        if not choices:
            return ""
        first_choice = choices[0]
        delta = first_choice.get("delta") or {}
        content = delta.get("content")
        if isinstance(content, str):
            return content
        message = first_choice.get("message") or {}
        message_content = message.get("content")
        if isinstance(message_content, str):
            return message_content
        return ""

    choices = getattr(chunk, "choices", None) or []
    if not choices:
        return ""

    first_choice = choices[0]
    delta = getattr(first_choice, "delta", None)
    if delta is not None:
        content = getattr(delta, "content", None)
        if isinstance(content, str):
            return content

    message = getattr(first_choice, "message", None)
    if message is not None:
        message_content = getattr(message, "content", None)
        if isinstance(message_content, str):
            return message_content

    return ""


async def _stream_model_output(payload: ChatRequest) -> AsyncIterator[str]:
    runtime_settings = get_settings()
    model_name = runtime_settings.model_name
    if not model_name:
        raise HTTPException(status_code=500, detail="MODEL_NAME is not configured")

    model_messages = [message.model_dump() for message in payload.messages]
    completion_kwargs = {
        "model": model_name,
        "messages": model_messages,
        "stream": True,
        "temperature": payload.temperature
    }
    if runtime_settings.api_base:
        completion_kwargs["api_base"] = runtime_settings.api_base
    if runtime_settings.llm_provider:
        completion_kwargs["custom_llm_provider"] = runtime_settings.llm_provider

    stream = await acompletion(**completion_kwargs)

    async for chunk in stream:
        text = _extract_text_from_chunk(chunk)
        if text:
            yield text


@app.get("/health")
async def health() -> dict[str, str | bool]:
    return {"success": True, "message": "ok"}


@app.post("/api/chat")
async def chat(payload: ChatRequest) -> StreamingResponse:
    runtime_settings = get_settings()
    if not runtime_settings.model_name:
        raise HTTPException(status_code=500, detail="MODEL_NAME is not configured")

    async def stream_generator() -> AsyncIterator[str]:
        try:
            async for text in _stream_model_output(payload):
                yield text
        except HTTPException:
            raise
        except Exception as error:  # pragma: no cover - runtime safeguard
            yield f"\n[ERROR] {error}"

    return StreamingResponse(stream_generator(), media_type="text/plain; charset=utf-8")
