import type { Metadata } from "next";

import { ManagerWorkspace } from "@/components/manager/manager-workspace";

export const metadata: Metadata = {
  title: "AI matching pipeline",
  description:
    "Open manager workspace with an SSE timeline, filtering funnel, and AI explanation review.",
};

export default function ManagerPage() {
  return <ManagerWorkspace />;
}
