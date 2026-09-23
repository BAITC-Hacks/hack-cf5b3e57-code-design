import { chatBackendUrl, proxyResponse, unavailableResponse } from "@/lib/chat/chat-proxy";

const MAX_BODY_BYTES = 8_192;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json(
      { error: "validation", message: "Request body is too large" },
      { status: 413 },
    );
  }

  let body: string;
  try {
    body = await request.text();
    JSON.parse(body);
  } catch {
    return Response.json(
      { error: "validation", message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(chatBackendUrl("/session"), {
      method: "POST",
      cache: "no-store",
      signal: request.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body,
    });
    return proxyResponse(upstream);
  } catch {
    return unavailableResponse();
  }
}
