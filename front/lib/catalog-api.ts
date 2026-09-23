import "server-only";

import { API_PREFIX } from "../../shared/contract";
import type {
  ContractorDetail,
  ContractorListQuery,
  ContractorListResponse,
} from "../../shared/contract";

const DEFAULT_BACKEND_URL = "http://localhost:3001";
const REQUEST_TIMEOUT_MS = 8_000;

export class CatalogApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly reason: "network" | "not_found" | "request_failed",
  ) {
    super(reason);
    this.name = "CatalogApiError";
  }
}

function getBackendUrl(path: string) {
  const baseUrl = process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL;
  return `${baseUrl.replace(/\/$/, "")}${API_PREFIX}${path}`;
}

async function fetchCatalogApi<T>(path: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(getBackendUrl(path), {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new CatalogApiError(503, "network");
  }

  if (!response.ok) {
    throw new CatalogApiError(
      response.status,
      response.status === 404 ? "not_found" : "request_failed",
    );
  }

  return (await response.json()) as T;
}

export function getContractors(query: ContractorListQuery = {}) {
  const params = new URLSearchParams();

  if (query.city) params.set("city", query.city);
  if (query.category) params.set("category", query.category);
  if (query.eventFormat) params.set("eventFormat", query.eventFormat);
  if (query.language) params.set("language", query.language);
  if (query.priceMin !== undefined) {
    params.set("priceMin", String(query.priceMin));
  }
  if (query.priceMax !== undefined) {
    params.set("priceMax", String(query.priceMax));
  }
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.offset !== undefined) params.set("offset", String(query.offset));

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return fetchCatalogApi<ContractorListResponse>(`/contractors${suffix}`);
}

export function getContractorById(id: string) {
  return fetchCatalogApi<ContractorDetail>(
    `/contractors/${encodeURIComponent(id)}`,
  );
}
