import type { ChatRequestPayload } from '@/types/chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export interface StreamChatOptions {
  signal?: AbortSignal;
  onChunk: (chunk: string) => void;
}

export async function streamChat(
  payload: ChatRequestPayload,
  options: StreamChatOptions
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    signal: options.signal
  });

  if (!response.ok) {
    let message = '对话请求失败';
    try {
      const json = (await response.json()) as { detail?: string; message?: string };
      message = json.detail || json.message || message;
    } catch {
      // noop
    }
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error('浏览器不支持流式响应');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const text = decoder.decode(value, { stream: true });
    if (text) {
      options.onChunk(text);
    }
  }

  const remainingText = decoder.decode();
  if (remainingText) {
    options.onChunk(remainingText);
  }
}
