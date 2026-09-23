import { NextRequest, NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, getBackendUrl } from "@/lib/admin-api";
import type { UpdateContractorStatusRequest } from "../../../../../../../shared/contract";

function isStatusPayload(value: unknown): value is UpdateContractorStatusRequest {
  return (
    typeof value === "object" &&
    value !== null &&
    "isActive" in value &&
    typeof value.isActive === "boolean"
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const accessToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!/^HK-\d{5}$/.test(id)) {
    return NextResponse.json({ error: "Invalid contractor id" }, { status: 400 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isStatusPayload(payload)) {
    return NextResponse.json(
      { error: "isActive must be a boolean" },
      { status: 400 },
    );
  }

  let upstream: Response;

  try {
    upstream = await fetch(
      getBackendUrl(`/admin/contractors/${encodeURIComponent(id)}/status`),
      {
        method: "PATCH",
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: payload.isActive,
        } satisfies UpdateContractorStatusRequest),
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Backend unavailable" },
      { status: 502 },
    );
  }

  const body = await upstream.text();
  const response = new NextResponse(body || null, {
    status: upstream.status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });

  if (upstream.status === 401 || upstream.status === 403) {
    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}
