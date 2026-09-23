import type {
  ApiError,
  MatchRequest,
  MatchResponse,
  ValidationError,
} from "../../shared/contract";
import { MATCH_MESSAGES } from "@/lib/i18n/messages/match";

const MATCH_ENDPOINT = "/match/api";

export class MatchApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fields?: ValidationError["fields"],
  ) {
    super(message);
    this.name = "MatchApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiError(value: unknown): value is ApiError {
  if (!isRecord(value)) return false;

  if (value.error === "validation") {
    return isRecord(value.fields);
  }

  return value.error === "internal" && typeof value.message === "string";
}

function isMatchResponse(value: unknown): value is MatchResponse {
  if (!isRecord(value)) return false;

  const outcomes = ["found", "no_category_in_city", "all_filtered_out"];

  return (
    typeof value.outcome === "string" &&
    outcomes.includes(value.outcome) &&
    Array.isArray(value.criteria) &&
    value.criteria.every((criterion) => typeof criterion === "string") &&
    Array.isArray(value.cards) &&
    Array.isArray(value.funnel) &&
    typeof value.summary === "string"
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function requestMatch(
  request: MatchRequest,
  signal?: AbortSignal,
): Promise<MatchResponse> {
  const errors = MATCH_MESSAGES[request.locale ?? "ru"].errors;
  let response: Response;

  try {
    response = await fetch(MATCH_ENDPOINT, {
      method: "POST",
      cache: "no-store",
      signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new MatchApiError(
      0,
      errors.connection,
    );
  }

  const payload = await readJson(response);

  if (!response.ok) {
    if (isApiError(payload)) {
      throw new MatchApiError(
        response.status,
        payload.error === "internal"
          ? payload.message
          : errors.invalid,
        payload.error === "validation" ? payload.fields : undefined,
      );
    }

    throw new MatchApiError(
      response.status,
      response.status >= 500
        ? errors.unavailable
        : errors.rejected,
    );
  }

  if (!isMatchResponse(payload)) {
    throw new MatchApiError(502, errors.malformed);
  }

  return payload;
}
