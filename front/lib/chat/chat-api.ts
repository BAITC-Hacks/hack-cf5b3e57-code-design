import type {
  ChatAttachment,
  ChatCreateSessionRequest,
  ChatCreateSessionResponse,
  ChatMessage,
  ChatSendRequest,
  ChatSseEventMap,
} from "../../../shared/contract";

const CHAT_API_BASE = "/chat/api";

export type ChatStreamEvent = {
  [EventName in keyof ChatSseEventMap]: {
    type: EventName;
    data: ChatSseEventMap[EventName];
  };
}[keyof ChatSseEventMap];

export class ChatApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ChatApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isChatMessage(value: unknown): value is ChatMessage {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.role === "user" || value.role === "assistant") &&
    typeof value.content === "string" &&
    typeof value.createdAt === "string" &&
    (value.attachments === undefined || Array.isArray(value.attachments))
  );
}

function isSessionResponse(value: unknown): value is ChatCreateSessionResponse {
  return (
    isRecord(value) &&
    typeof value.sessionId === "string" &&
    (value.mode === "search" || value.mode === "bundle") &&
    (value.locale === "ru" || value.locale === "kk" || value.locale === "en") &&
    typeof value.greeting === "string"
  );
}

function isAttachment(value: unknown): value is ChatAttachment {
  return (
    isRecord(value) &&
    ((value.type === "match" && isRecord(value.match)) ||
      (value.type === "bundle" && isRecord(value.bundle)))
  );
}

function isStreamEvent(value: unknown): value is ChatStreamEvent {
  if (!isRecord(value) || typeof value.type !== "string" || !isRecord(value.data)) {
    return false;
  }

  switch (value.type) {
    case "token":
      return typeof value.data.text === "string";
    case "tool_start":
      return (
        (value.data.name === "search_contractors" ||
          value.data.name === "build_event_bundle") &&
        isRecord(value.data.args)
      );
    case "attachment":
      return isAttachment(value.data);
    case "done":
      return isChatMessage(value.data.message);
    case "error":
      return typeof value.data.code === "string" && typeof value.data.message === "string";
    default:
      return false;
  }
}

async function responsePayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function errorMessage(payload: unknown, fallback: string): string {
  if (isRecord(payload) && typeof payload.message === "string") return payload.message;
  if (isRecord(payload) && typeof payload.error === "string") return payload.error;
  return fallback;
}

export async function createChatSession(
  request: ChatCreateSessionRequest,
  signal?: AbortSignal,
): Promise<ChatCreateSessionResponse> {
  let response: Response;
  try {
    response = await fetch(`${CHAT_API_BASE}/session`, {
      method: "POST",
      cache: "no-store",
      signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ChatApiError(0, "Unable to connect to the chat service");
  }

  const payload = await responsePayload(response);
  if (!response.ok) {
    throw new ChatApiError(
      response.status,
      errorMessage(payload, "The chat session could not be created"),
    );
  }
  if (!isSessionResponse(payload)) {
    throw new ChatApiError(502, "The chat service returned an invalid session");
  }
  return payload;
}

export async function getChatHistory(
  sessionId: string,
  signal?: AbortSignal,
): Promise<ChatMessage[]> {
  const response = await fetch(`${CHAT_API_BASE}/${encodeURIComponent(sessionId)}`, {
    cache: "no-store",
    signal,
    headers: { Accept: "application/json" },
  });
  const payload = await responsePayload(response);
  if (!response.ok) {
    throw new ChatApiError(
      response.status,
      errorMessage(payload, "The conversation could not be loaded"),
    );
  }
  if (
    !isRecord(payload) ||
    !Array.isArray(payload.messages) ||
    !payload.messages.every(isChatMessage)
  ) {
    throw new ChatApiError(502, "The chat service returned an invalid history");
  }
  return payload.messages;
}

function parseSseBlock(block: string): ChatStreamEvent | null {
  let eventType = "";
  const data: string[] = [];

  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith("event:")) eventType = line.slice(6).trim();
    if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  if (!eventType || data.length === 0) return null;

  try {
    const event = { type: eventType, data: JSON.parse(data.join("\n")) };
    return isStreamEvent(event) ? event : null;
  } catch {
    return null;
  }
}

export async function streamChatMessage(
  sessionId: string,
  request: ChatSendRequest,
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(
      `${CHAT_API_BASE}/${encodeURIComponent(sessionId)}/message`,
      {
        method: "POST",
        cache: "no-store",
        signal,
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ChatApiError(0, "Unable to connect to the chat service");
  }

  if (!response.ok || !response.body) {
    const payload = await responsePayload(response);
    throw new ChatApiError(
      response.status,
      errorMessage(payload, "The assistant could not process the message"),
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let terminalEventSeen = false;

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const event = parseSseBlock(block);
      if (!event) continue;
      onEvent(event);
      if (event.type === "done" || event.type === "error") terminalEventSeen = true;
    }
    if (done) break;
  }

  const trailing = parseSseBlock(buffer);
  if (trailing) {
    onEvent(trailing);
    if (trailing.type === "done" || trailing.type === "error") terminalEventSeen = true;
  }
  if (!terminalEventSeen) {
    throw new ChatApiError(502, "The assistant stream ended before completion");
  }
}
