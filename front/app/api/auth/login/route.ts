import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  getBackendUrl,
} from "@/lib/admin-api";

import type { LoginRequest, LoginResponse } from "../../../../../shared/contract";

function isLoginResponse(value: unknown): value is LoginResponse {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Partial<LoginResponse>;
  const user = candidate.user;

  return (
    typeof candidate.accessToken === "string" &&
    candidate.accessToken.length > 0 &&
    candidate.accessToken.length <= 3800 &&
    typeof candidate.expiresIn === "number" &&
    Number.isFinite(candidate.expiresIn) &&
    typeof user === "object" &&
    user !== null &&
    typeof user.id === "number" &&
    typeof user.email === "string" &&
    (typeof user.name === "string" || user.name === null) &&
    (user.role === "USER" || user.role === "ADMIN")
  );
}

function isValidEmail(value: string) {
  return (
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

function loginRedirect(request: NextRequest, error: string) {
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("error", error);
  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return loginRedirect(request, "invalid");
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isValidEmail(email) || password.length < 8 || password.length > 128) {
    return loginRedirect(request, "fields");
  }

  let upstream: Response;

  try {
    upstream = await fetch(getBackendUrl("/auth/login"), {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password } satisfies LoginRequest),
    });
  } catch {
    return loginRedirect(request, "unavailable");
  }

  if (!upstream.ok) {
    return loginRedirect(
      request,
      upstream.status === 401 ? "credentials" : "unavailable",
    );
  }

  let login: unknown;

  try {
    login = await upstream.json();
  } catch {
    return loginRedirect(request, "unavailable");
  }

  if (!isLoginResponse(login)) {
    return loginRedirect(request, "unavailable");
  }

  if (login.user.role !== "ADMIN") {
    return loginRedirect(request, "forbidden");
  }

  const maxAge = Math.min(
    Number.isFinite(login.expiresIn) && login.expiresIn > 0
      ? Math.floor(login.expiresIn)
      : 60 * 60,
    60 * 60 * 24 * 7,
  );
  const response = NextResponse.redirect(new URL("/admin", request.url), 303);

  response.headers.set("Cache-Control", "no-store");
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: login.accessToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
    priority: "high",
  });

  return response;
}
