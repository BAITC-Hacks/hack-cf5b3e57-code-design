import type { Metadata } from "next";

import { ManagerWorkspace } from "@/components/manager/manager-workspace";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import { siteCopy } from "@/components/site/site-copy";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: siteCopy[locale].venues,
    description: "Open manager workspace with an SSE timeline, filtering funnel, and AI explanation review.",
  };
}

export default function ManagerPage() {
  return <div className="tm-manager-page"><ManagerWorkspace /></div>;
}
