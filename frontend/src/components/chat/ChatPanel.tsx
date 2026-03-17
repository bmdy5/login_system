'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import { streamChat } from '@/lib/chatApi';
import type { ChatMessage } from '@/types/chat';

function createMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content
  };
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage('assistant', '你好，我是你的大模型助手。你可以直接输入问题。')
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const canSubmit = useMemo(() => !loading && input.trim().length > 0, [input, loading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || loading) {
      return;
    }

    setError('');
    setInput('');
    setLoading(true);

    const userMessage = createMessage('user', content);
    const assistantMessage = createMessage('assistant', '');
    const requestMessages = [
      ...messages.map((message) => ({ role: message.role, content: message.content })),
      { role: 'user' as const, content }
    ];

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat(
        { messages: requestMessages },
        {
          signal: controller.signal,
          onChunk: (chunk) => {
            setMessages((prev) =>
              prev.map((item) =>
                item.id === assistantMessage.id
                  ? { ...item, content: `${item.content}${chunk}` }
                  : item
              )
            );
          }
        }
      );
    } catch (streamError) {
      if (controller.signal.aborted) {
        setError('已取消本次对话');
      } else {
        setError(streamError instanceof Error ? streamError.message : '流式对话失败');
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  return (
    <section className="chat-panel">
      <div className="chat-list" aria-live="polite">
        {messages.map((message) => (
          <article key={message.id} className={`chat-item chat-item-${message.role}`}>
            <p className="chat-role">{message.role === 'assistant' ? '助手' : '你'}</p>
            <p className="chat-text">{message.content || (loading ? '...' : '')}</p>
          </article>
        ))}
      </div>

      {error ? <p className="chat-error">{error}</p> : null}

      <form className="chat-form" onSubmit={handleSubmit}>
        <textarea
          className="chat-input"
          placeholder="输入你的问题..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={3}
        />
        <div className="chat-actions">
          <button className="button" type="submit" disabled={!canSubmit}>
            {loading ? '生成中...' : '发送'}
          </button>
          <button className="button button-secondary" type="button" onClick={handleCancel} disabled={!loading}>
            停止
          </button>
        </div>
      </form>
    </section>
  );
}
