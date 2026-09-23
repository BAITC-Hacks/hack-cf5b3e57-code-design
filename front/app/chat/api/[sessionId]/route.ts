import {
  chatBackendUrl,
  proxyResponse,
  unavailableResponse,
  validSessionId,
} from "@/lib/chat/chat-proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  if (!validSessionId(sessionId)) {
    return Response.json(
      { error: "validation", message: "Invalid chat session id" },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(
      chatBackendUrl(`/${encodeURIComponent(sessionId)}`),
      {
        cache: "no-store",
        signal: request.signal,
        headers: { Accept: "application/json" },
      },
    );
    return proxyResponse(upstream);
  } catch {
    return unavailableResponse();
  }
}
