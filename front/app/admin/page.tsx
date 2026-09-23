import type { Metadata } from "next";

import { ManagerWorkspace } from "@/components/manager/manager-workspace";

export const metadata: Metadata = {
  title: "ToiMatch — площадка для жюри",
  description:
    "Открытый экран пайплайна подбора с SSE-таймлайном, воронкой и проверкой объяснений.",
};

export default function AdminPage() {
  return <ManagerWorkspace />;
}
