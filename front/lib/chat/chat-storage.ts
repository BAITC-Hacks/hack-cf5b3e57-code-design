import type {
  CardFact,
  ChatAttachment,
  ChatMessage,
  ChatMode,
  EventBundle,
  FunnelStep,
  MatchCard,
  MatchResponse,
} from "../../../shared/contract";

export const CHAT_STORAGE_KEY = "toimatch.chat.v1";

const STORAGE_VERSION = 1 as const;
const MAX_STORAGE_CHARS = 400_000;
const MAX_MESSAGES_PER_MODE = 50;
const MAX_MESSAGE_CONTENT_LENGTH = 8_000;
const MAX_ATTACHMENTS_PER_MESSAGE = 4;
const MAX_SESSION_ID_LENGTH = 256;

export interface StoredChatConversation {
  attachment: ChatAttachment | null;
  messages: ChatMessage[];
  sessionId: string;
  updatedAt: number;
}

export interface StoredChatState {
  activeMode: ChatMode;
  conversations: Partial<Record<ChatMode, StoredChatConversation>>;
  version: typeof STORAGE_VERSION;
}

const MATCH_OUTCOMES = [
  "found",
  "no_category_in_city",
  "all_filtered_out",
] as const;
const FACT_KEYS = [
  "budget",
  "format",
  "language",
  "hours",
  "date",
  "signal",
  "description",
] as const;
const FUNNEL_STEPS = [
  "city",
  "category",
  "date",
  "format",
  "budget",
  "language",
  "hours",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBoundedString(
  value: unknown,
  maxLength = MAX_MESSAGE_CONTENT_LENGTH,
): value is string {
  return typeof value === "string" && value.length <= maxLength;
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isStringArray(value: unknown, maxItems: number) {
  return (
    Array.isArray(value) &&
    value.length <= maxItems &&
    value.every((item) => isBoundedString(item, 2_000))
  );
}

function isCardFact(value: unknown): value is CardFact {
  return (
    isRecord(value) &&
    typeof value.key === "string" &&
    FACT_KEYS.includes(value.key as (typeof FACT_KEYS)[number]) &&
    isBoundedString(value.label, 2_000) &&
    typeof value.verified === "boolean"
  );
}

function isMatchCard(value: unknown): value is MatchCard {
  return (
    isRecord(value) &&
    isBoundedString(value.id, 256) &&
    isBoundedString(value.anonName, 1_000) &&
    isBoundedString(value.category, 1_000) &&
    isBoundedString(value.city, 1_000) &&
    isFiniteNonNegativeNumber(value.priceFromKzt) &&
    isBoundedString(value.reason) &&
    Array.isArray(value.factsUsed) &&
    value.factsUsed.length <= 20 &&
    value.factsUsed.every(isCardFact) &&
    isRecord(value.flags) &&
    typeof value.flags.synthetic === "boolean" &&
    typeof value.flags.priceImputed === "boolean" &&
    typeof value.flags.cityImputed === "boolean"
  );
}

function isFunnelStep(value: unknown): value is FunnelStep {
  return (
    isRecord(value) &&
    typeof value.step === "string" &&
    FUNNEL_STEPS.includes(value.step as (typeof FUNNEL_STEPS)[number]) &&
    isFiniteNonNegativeNumber(value.before) &&
    isFiniteNonNegativeNumber(value.after) &&
    isBoundedString(value.removedReason, 2_000)
  );
}

function isMatchResponse(value: unknown): value is MatchResponse {
  return (
    isRecord(value) &&
    typeof value.outcome === "string" &&
    MATCH_OUTCOMES.includes(value.outcome as (typeof MATCH_OUTCOMES)[number]) &&
    isStringArray(value.criteria, 20) &&
    Array.isArray(value.cards) &&
    value.cards.length <= 3 &&
    value.cards.every(isMatchCard) &&
    Array.isArray(value.funnel) &&
    value.funnel.length <= 20 &&
    value.funnel.every(isFunnelStep) &&
    isBoundedString(value.summary)
  );
}

function isBundleItem(value: unknown) {
  return (
    isRecord(value) &&
    isBoundedString(value.category, 1_000) &&
    isFiniteNonNegativeNumber(value.allocatedBudgetKzt) &&
    isMatchResponse(value.match)
  );
}

function isEventBundle(value: unknown): value is EventBundle {
  return (
    isRecord(value) &&
    isBoundedString(value.city, 1_000) &&
    isBoundedString(value.date, 100) &&
    isBoundedString(value.eventType, 1_000) &&
    isFiniteNonNegativeNumber(value.totalBudgetKzt) &&
    Array.isArray(value.required) &&
    value.required.length <= 30 &&
    value.required.every(isBundleItem) &&
    Array.isArray(value.recommended) &&
    value.recommended.length <= 30 &&
    value.recommended.every(isBundleItem) &&
    isBoundedString(value.summary)
  );
}

function isChatAttachment(value: unknown): value is ChatAttachment {
  return (
    isRecord(value) &&
    ((value.type === "match" && isMatchResponse(value.match)) ||
      (value.type === "bundle" && isEventBundle(value.bundle)))
  );
}

function isChatMessage(value: unknown): value is ChatMessage {
  return (
    isRecord(value) &&
    isBoundedString(value.id, 256) &&
    (value.role === "user" || value.role === "assistant") &&
    isBoundedString(value.content) &&
    isBoundedString(value.createdAt, 100) &&
    (value.attachments === undefined ||
      (Array.isArray(value.attachments) &&
        value.attachments.length <= MAX_ATTACHMENTS_PER_MESSAGE &&
        value.attachments.every(isChatAttachment)))
  );
}

export function dedupeChatMessages(messages: readonly ChatMessage[]) {
  const result: ChatMessage[] = [];
  const indexById = new Map<string, number>();

  for (const message of messages) {
    const existingIndex = indexById.get(message.id);
    if (existingIndex === undefined) {
      indexById.set(message.id, result.length);
      result.push(message);
    } else {
      result[existingIndex] = message;
    }
  }

  return result;
}

function parseConversation(value: unknown): StoredChatConversation | null {
  if (
    !isRecord(value) ||
    !isBoundedString(value.sessionId, MAX_SESSION_ID_LENGTH) ||
    value.sessionId.length === 0 ||
    !Array.isArray(value.messages) ||
    value.messages.length > MAX_MESSAGES_PER_MODE ||
    !value.messages.every(isChatMessage) ||
    (value.attachment !== null && !isChatAttachment(value.attachment)) ||
    !isFiniteNonNegativeNumber(value.updatedAt)
  ) {
    return null;
  }

  return {
    attachment: value.attachment,
    messages: dedupeChatMessages(value.messages),
    sessionId: value.sessionId,
    updatedAt: value.updatedAt,
  };
}

function parseStoredState(value: unknown): StoredChatState | null {
  if (
    !isRecord(value) ||
    value.version !== STORAGE_VERSION ||
    (value.activeMode !== "search" && value.activeMode !== "bundle") ||
    !isRecord(value.conversations)
  ) {
    return null;
  }

  const conversations: StoredChatState["conversations"] = {};
  for (const mode of ["search", "bundle"] as const) {
    const candidate = value.conversations[mode];
    if (candidate === undefined) continue;
    const conversation = parseConversation(candidate);
    if (!conversation) return null;
    conversations[mode] = conversation;
  }

  return {
    activeMode: value.activeMode,
    conversations,
    version: STORAGE_VERSION,
  };
}

function removeStoredState() {
  try {
    window.localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch {
    // Storage may be disabled. The in-memory chat remains fully functional.
  }
}

export function loadChatState(): StoredChatState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;
    if (raw.length > MAX_STORAGE_CHARS) {
      removeStoredState();
      return null;
    }

    const parsed = parseStoredState(JSON.parse(raw));
    if (!parsed) removeStoredState();
    return parsed;
  } catch {
    removeStoredState();
    return null;
  }
}

function limitedMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    content: message.content.slice(0, MAX_MESSAGE_CONTENT_LENGTH),
    ...(message.attachments
      ? { attachments: message.attachments.slice(0, MAX_ATTACHMENTS_PER_MESSAGE) }
      : {}),
  };
}

function normalizedState(state: StoredChatState): StoredChatState {
  const conversations: StoredChatState["conversations"] = {};

  for (const mode of ["search", "bundle"] as const) {
    const conversation = state.conversations[mode];
    if (!conversation) continue;
    conversations[mode] = {
      ...conversation,
      messages: dedupeChatMessages(conversation.messages)
        .slice(-MAX_MESSAGES_PER_MODE)
        .map(limitedMessage),
    };
  }

  return { ...state, conversations, version: STORAGE_VERSION };
}

function serializeWithinLimit(state: StoredChatState) {
  const candidate = normalizedState(state);
  let serialized = JSON.stringify(candidate);

  while (serialized.length > MAX_STORAGE_CHARS) {
    const conversations = Object.values(candidate.conversations).filter(
      (conversation): conversation is StoredChatConversation => Boolean(conversation),
    );
    const longest = conversations.sort(
      (left, right) => right.messages.length - left.messages.length,
    )[0];

    if (!longest || longest.messages.length <= 1) break;
    longest.messages.shift();
    serialized = JSON.stringify(candidate);
  }

  if (serialized.length <= MAX_STORAGE_CHARS) return serialized;

  for (const conversation of Object.values(candidate.conversations)) {
    if (conversation) conversation.attachment = null;
  }
  serialized = JSON.stringify(candidate);

  if (serialized.length > MAX_STORAGE_CHARS) {
    for (const conversation of Object.values(candidate.conversations)) {
      if (!conversation) continue;
      conversation.messages = conversation.messages.map((message) => {
        const messageWithoutAttachments = { ...message };
        delete messageWithoutAttachments.attachments;
        return messageWithoutAttachments;
      });
    }
    serialized = JSON.stringify(candidate);
  }

  return serialized.length <= MAX_STORAGE_CHARS ? serialized : null;
}

export function saveChatState(state: StoredChatState) {
  if (typeof window === "undefined") return false;

  try {
    const serialized = serializeWithinLimit(state);
    if (!serialized) return false;
    window.localStorage.setItem(CHAT_STORAGE_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}

export function emptyChatState(activeMode: ChatMode = "search"): StoredChatState {
  return {
    activeMode,
    conversations: {},
    version: STORAGE_VERSION,
  };
}
