import type { Metadata } from "next";

import { ManagerWorkspace } from "@/components/manager/manager-workspace";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const seo = {
    ru: {
      title: "Рабочее место площадки",
      description:
        "Запустите подбор и смотрите, как он идёт: шаги в реальном времени, воронка отбора, проверка каждого факта и сравнение с другой датой.",
    },
    kk: {
      title: "Платформаның жұмыс орны",
      description:
        "Таңдауды іске қосып, барысын бақылаңыз: нақты уақыттағы қадамдар, іріктеу воронкасы, әр деректі тексеру және басқа күнмен салыстыру.",
    },
    en: {
      title: "Platform workspace",
      description:
        "Run a match and watch it work: live steps, the selection funnel, a check of every fact and a comparison with another date.",
    },
  }[locale];

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: "/manager" },
  };
}

export default function ManagerPage() {
  return <ManagerWorkspace />;
}
