import { API_PREFIX } from "../../shared/contract";
import type {
  MatchRequest,
  MatchResponse,
  SseEventMap,
} from "../../shared/contract";

type StreamHandlers = Partial<{
  [Type in keyof SseEventMap]: (payload: SseEventMap[Type]) => void;
}> & {
  open?: () => void;
  connectionError?: (message: string) => void;
  parseError?: (message: string) => void;
};

const DEFAULT_BACKEND_URL = "http://localhost:3001";

function apiBaseUrl() {
  const configured =
    process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_BACKEND_URL;
  const base = configured.replace(/\/+$/, "");

  return base.endsWith(API_PREFIX) ? base : `${base}${API_PREFIX}`;
}

function matchStreamUrl(request: MatchRequest) {
  const query = new URLSearchParams({
    city: request.city,
    date: request.date,
    eventType: request.eventType,
    category: request.category,
    budgetKzt: String(request.budgetKzt),
  });

  if (request.durationHours !== undefined) {
    query.set("durationHours", String(request.durationHours));
  }

  if (request.language) {
    query.set("language", request.language);
  }

  if (request.locale) {
    query.set("locale", request.locale);
  }

  return `${apiBaseUrl()}/match/stream?${query.toString()}`;
}

function asMessage(event: Event) {
  return "data" in event && typeof event.data === "string"
    ? (event as MessageEvent<string>)
    : null;
}

/**
 * Opens the public matching pipeline stream. The returned function is
 * idempotent and immediately stops the browser connection.
 */
export function openMatchStream(
  request: MatchRequest,
  handlers: StreamHandlers,
) {
  const source = new EventSource(matchStreamUrl(request));
  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    source.close();
  };

  const bind = <Type extends keyof SseEventMap>(
    type: Type,
    handler: ((payload: SseEventMap[Type]) => void) | undefined,
  ) => {
    source.addEventListener(type, (event) => {
      const message = asMessage(event);

      if (!message) return;

      try {
        const payload = JSON.parse(message.data) as SseEventMap[Type];
        handler?.(payload);

        if (type === "done" || type === "error") {
          close();
        }
      } catch {
        close();
        handlers.parseError?.(
          "stream_parse_error",
        );
      }
    });
  };

  bind("criteria", handlers.criteria);
  bind("filter_step", handlers.filter_step);
  bind("ranked", handlers.ranked);
  bind("card", handlers.card);
  bind("critic", handlers.critic);
  bind("done", handlers.done);
  bind("error", handlers.error);

  source.onopen = () => handlers.open?.();
  source.onerror = (event) => {
    // The backend also has a named `error` SSE event. It arrives as a
    // MessageEvent and is handled by bind("error") above.
    if (asMessage(event) || closed) return;

    close();
    handlers.connectionError?.(
      "stream_connection_error",
    );
  };

  return close;
}

/** Collects only the final `done` payload; useful for side-by-side dates. */
export function collectMatchResult(request: MatchRequest) {
  let closeSource: () => void = () => undefined;
  let settled = false;
  let rejectResult: (reason: Error) => void = () => undefined;

  const result = new Promise<MatchResponse>((resolve, reject) => {
    rejectResult = reject;
    closeSource = openMatchStream(request, {
      done: (payload) => {
        settled = true;
        resolve(payload);
      },
      error: (payload) => {
        settled = true;
        reject(new Error(payload.message));
      },
      connectionError: (message) => {
        settled = true;
        reject(new Error(message));
      },
      parseError: (message) => {
        settled = true;
        reject(new Error(message));
      },
    });
  });

  return {
    result,
    cancel: () => {
      closeSource();

      if (!settled) {
        settled = true;
        const error = new Error("stream_cancelled");
        error.name = "AbortError";
        rejectResult(error);
      }
    },
  };
}
