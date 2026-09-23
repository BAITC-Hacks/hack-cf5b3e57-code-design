import { NextRequest, NextResponse } from "next/server";

import { API_PREFIX } from "../../../../shared/contract";
import type {
  InternalError,
  MatchRequest,
  ValidationError,
} from "../../../../shared/contract";
import type { Locale } from "../../../../shared/contract";
import { MATCH_MESSAGES } from "@/lib/i18n/messages/match";

const DEFAULT_BACKEND_URL = "http://localhost:3001";
const MAX_BODY_BYTES = 16_384;

function getBackendUrl() {
  const baseUrl =
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_BACKEND_URL;

  return `${baseUrl.replace(/\/$/, "")}${API_PREFIX}/match`;
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

function requestLocale(request: NextRequest): Locale {
  const language = request.headers.get("accept-language")?.toLowerCase() ?? "";
  if (language.startsWith("kk")) return "kk";
  if (language.startsWith("en")) return "en";
  return "ru";
}

function validationError(fields: Record<string, string>, status = 400) {
  return NextResponse.json(
    { error: "validation", fields } satisfies ValidationError,
    { status },
  );
}

export async function POST(request: NextRequest) {
  let locale = requestLocale(request);

  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: "internal", message: MATCH_MESSAGES[locale].errors.forbidden } satisfies InternalError,
      { status: 403 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return validationError({ request: MATCH_MESSAGES[locale].errors.tooLarge }, 413);
  }

  let payload: MatchRequest;

  try {
    payload = (await request.json()) as MatchRequest;
    if (payload.locale === "ru" || payload.locale === "kk" || payload.locale === "en") {
      locale = payload.locale;
    }
  } catch {
    return validationError({ request: MATCH_MESSAGES[locale].errors.invalidJson });
  }

  let upstream: Response;

  try {
    upstream = await fetch(getBackendUrl(), {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      {
        error: "internal",
        message: MATCH_MESSAGES[locale].errors.backend,
      } satisfies InternalError,
      { status: 503 },
    );
  }

  const body = await upstream.text();

  return new NextResponse(body || null, {
    status: upstream.status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
