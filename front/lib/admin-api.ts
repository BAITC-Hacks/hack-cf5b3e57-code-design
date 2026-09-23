import "server-only";

import { cookies } from "next/headers";

import { API_PREFIX } from "../../shared/contract";
import type {
  AdminContractorsQuery,
  AdminContractorsResponse,
  AdminOverviewResponse,
} from "../../shared/contract";

export type {
  AdminContractor as Contractor,
  AdminContractorsQuery as ContractorFilters,
  AdminContractorsResponse as ContractorsResponse,
  AdminOverviewResponse as OverviewData,
  AuthUser as AdminUser,
} from "../../shared/contract";

export const ADMIN_SESSION_COOKIE = "admin_session";

const DEFAULT_BACKEND_URL = "http://localhost:3001";

export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

function backendUrl(path: string) {
  const baseUrl = process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL;
  return `${baseUrl.replace(/\/$/, "")}${API_PREFIX}${path}`;
}

async function fetchAdminApi<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(backendUrl(path), {
      ...init,
      cache: "no-store",
      signal: init?.signal ?? AbortSignal.timeout(8_000),
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...init?.headers,
      },
    });
  } catch {
    throw new AdminApiError(
      503,
      "Сервис данных временно недоступен. Попробуйте ещё раз позже.",
    );
  }

  if (!response.ok) {
    throw new AdminApiError(
      response.status,
      response.status >= 500
        ? "Сервис данных временно недоступен."
        : "Не удалось получить данные.",
    );
  }

  return (await response.json()) as T;
}

async function requireAccessToken() {
  const accessToken = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;

  if (!accessToken) {
    throw new AdminApiError(401, "Сессия не найдена.");
  }

  return accessToken;
}

export async function getAdminDashboard(filters: AdminContractorsQuery) {
  const accessToken = await requireAccessToken();
  const query = new URLSearchParams({
    status: filters.status,
    page: String(filters.page),
    pageSize: String(filters.pageSize),
  });

  if (filters.search) query.set("search", filters.search);
  if (filters.city) query.set("city", filters.city);
  if (filters.category) query.set("category", filters.category);

  const [overview, contractors] = await Promise.all([
    fetchAdminApi<AdminOverviewResponse>("/admin/overview", accessToken),
    fetchAdminApi<AdminContractorsResponse>(
      `/admin/contractors?${query.toString()}`,
      accessToken,
    ),
  ]);

  return { overview, contractors };
}

export function getBackendUrl(path: string) {
  return backendUrl(path);
}
