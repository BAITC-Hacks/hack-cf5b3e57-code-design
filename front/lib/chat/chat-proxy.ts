import "server-only";

import { API_PREFIX } from "@shared/contract";

const DEFAULT_BACKEND_URL = "http://localhost:3001";

export function chatBackendUrl(path: string): string {
  const baseUrl =
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_BACKEND_URL;
  return `${baseUrl.replace(/\/$/, "")}${API_PREFIX}/chat${path}`;
}

export function proxyResponse(upstream: Response): Response {
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      "X-Accel-Buffering": "no",
    },
  });
}

export function unavailableResponse(): Response {
  return Response.json(
    { error: "internal", message: "Chat backend is unavailable" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

export function validSessionId(sessionId: string): boolean {
  return /^[A-Za-z0-9_-]{1,128}$/.test(sessionId);
}
