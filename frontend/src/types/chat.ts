export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export interface ChatMessagePayload {
  role: ChatRole;
  content: string;
}

export interface ChatRequestPayload {
  messages: ChatMessagePayload[];
  temperature?: number;
}
