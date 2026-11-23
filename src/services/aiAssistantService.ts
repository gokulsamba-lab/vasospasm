import type { LiveTelemetryContext } from '../data/vasosenseKnowledgeBase';

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  isError?: boolean;
}

export interface AiChatApiResponse {
  reply: string;
  model: string;
}

export async function sendAiAssistantMessage(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  telemetryContext?: LiveTelemetryContext
): Promise<AiChatApiResponse> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, telemetryContext }),
  });

  const payload = (await res.json().catch(() => ({}))) as Partial<AiChatApiResponse> & {
    error?: string;
  };

  if (!res.ok) {
    throw new Error(
      payload.error || `VasoSense AI request failed with status ${res.status}.`
    );
  }

  if (!payload.reply) {
    throw new Error('VasoSense AI returned an empty response.');
  }

  return {
    reply: payload.reply,
    model: payload.model || 'gemini-2.5-flash',
  };
}
