import type { Metadata } from "next";

import { ManagerWorkspace } from "@/components/manager/manager-workspace";

export const metadata: Metadata = {
  title: "Площадка для жюри",
  description:
    "Открытый экран подбора: шаги в реальном времени, воронка отбора и проверка объяснений.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminPage() {
  return <ManagerWorkspace />;
}
