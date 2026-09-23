import { API_PREFIX } from "../../../shared/contract";
import type {
  ChatCreateSessionRequest,
  ChatCreateSessionResponse,
  ChatSendRequest,
  ChatSseEventMap,
} from "../../../shared/contract";

type ChatStreamEvent = {
  [Type in keyof ChatSseEventMap]: {
    type: Type;
    data: ChatSseEventMap[Type];
  };
}[keyof ChatSseEventMap];

const DEFAULT_BACKEND_URL = "http://localhost:3001";

export class ChatApiError extends Error {
  constructor(message: string, public readonly status = 0) {
    super(message);
    this.name = "ChatApiError";
  }
}

function apiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_BACKEND_URL;
  const base = configured.replace(/\/+$/, "");
  return base.endsWith(API_PREFIX) ? base : `${base}${API_PREFIX}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isSession(value: unknown): value is ChatCreateSessionResponse {
  return isRecord(value) &&
    typeof value.sessionId === "string" &&
    (value.mode === "search" || value.mode === "bundle") &&
    (value.locale === "ru" || value.locale === "kk" || value.locale === "en") &&
    typeof value.greeting === "string";
}

async function errorMessage(response: Response) {
  try {
    const payload: unknown = await response.json();
    if (isRecord(payload) && typeof payload.message === "string") return payload.message;
  } catch {
    // Use the status below if the backend did not return JSON.
  }
  return `Chat API returned HTTP ${response.status}`;
}

export async function createChatSession(
  request: ChatCreateSessionRequest,
  signal: AbortSignal,
): Promise<ChatCreateSessionResponse> {
  const response = await fetch(`${apiBaseUrl()}/chat/session`, {
    method: "POST",
    cache: "no-store",
    signal,
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) throw new ChatApiError(await errorMessage(response), response.status);
  const payload: unknown = await response.json();
  if (!isSession(payload)) throw new ChatApiError("Invalid chat session response", 502);
  return payload;
}

function parseEvent(type: string, rawData: string): ChatStreamEvent | null {
  if (![
    "token", "tool_start", "attachment", "done", "error",
  ].includes(type)) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(rawData);
  } catch {
    throw new ChatApiError("Invalid chat stream JSON", 502);
  }
  if (!isRecord(payload)) throw new ChatApiError("Invalid chat stream event", 502);

  switch (type) {
    case "token":
      if (typeof payload.text === "string") return { type, data: { text: payload.text } };
      break;
    case "tool_start":
      if (typeof payload.name === "string" && isRecord(payload.args)) {
        // The backend may add new tool names before the shared contract is updated.
        return { type, data: payload as ChatSseEventMap["tool_start"] };
      }
      break;
    case "attachment":
      if (payload.type === "match" && isRecord(payload.match)) {
        return { type, data: payload as unknown as ChatSseEventMap["attachment"] };
      }
      if (payload.type === "bundle" && isRecord(payload.bundle)) {
        return { type, data: payload as unknown as ChatSseEventMap["attachment"] };
      }
      break;
    case "done":
      if (isRecord(payload.message) &&
        typeof payload.message.id === "string" &&
        typeof payload.message.content === "string") {
        return { type, data: payload as unknown as ChatSseEventMap["done"] };
      }
      break;
    case "error":
      if (typeof payload.message === "string" && typeof payload.code === "string") {
        return { type, data: payload as unknown as ChatSseEventMap["error"] };
      }
      break;
  }
  throw new ChatApiError(`Invalid ${type} event from chat stream`, 502);
}

/** POST-based SSE must be consumed with fetch; EventSource supports only GET. */
export async function sendChatMessage(
  sessionId: string,
  request: ChatSendRequest,
  onEvent: (event: ChatStreamEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch(`${apiBaseUrl()}/chat/${encodeURIComponent(sessionId)}/message`, {
    method: "POST",
    cache: "no-store",
    signal,
    headers: { Accept: "text/event-stream", "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new ChatApiError(await errorMessage(response), response.status);
  if (!response.body) throw new ChatApiError("Chat stream is unavailable", 502);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventType = "";
  let dataLines: string[] = [];
  let doneReceived = false;

  const dispatch = () => {
    if (dataLines.length === 0) {
      eventType = "";
      return;
    }
    const parsed = parseEvent(eventType || "message", dataLines.join("\n"));
    eventType = "";
    dataLines = [];
    if (!parsed) return;
    onEvent(parsed);
    if (parsed.type === "done") doneReceived = true;
    if (parsed.type === "error") throw new ChatApiError(parsed.data.message);
  };

  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      let newline = buffer.indexOf("\n");
      while (newline !== -1) {
        const line = buffer.slice(0, newline).replace(/\r$/, "");
        buffer = buffer.slice(newline + 1);
        if (line === "") dispatch();
        else if (line.startsWith("event:")) eventType = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
        newline = buffer.indexOf("\n");
      }
    }
    buffer += decoder.decode();
    if (buffer.trim()) {
      const line = buffer.replace(/\r$/, "");
      if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
      else if (line.startsWith("event:")) eventType = line.slice(6).trim();
    }
    dispatch();
    if (!doneReceived) throw new ChatApiError("Chat stream ended without a final answer", 502);
  } finally {
    reader.releaseLock();
  }
}
