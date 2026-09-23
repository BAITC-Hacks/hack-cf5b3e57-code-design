import { NextRequest, NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/lib/admin-api";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const response = NextResponse.redirect(
    new URL("/admin/login", request.url),
    303,
  );

  response.headers.set("Cache-Control", "no-store");
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
