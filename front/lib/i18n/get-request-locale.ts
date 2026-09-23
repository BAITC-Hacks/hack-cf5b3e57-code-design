import "server-only";

import { cookies } from "next/headers";
import type { Locale } from "../../../shared/contract";
import { LOCALE_COOKIE, normalizeLocale } from "./config";

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}
