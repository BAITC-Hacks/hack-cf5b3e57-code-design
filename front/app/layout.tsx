import type { Metadata } from "next";
import "@fontsource-variable/onest";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ToiMatch — подбор подрядчиков",
    template: "%s · ToiMatch",
  },
  description:
    "Объяснимый подбор подрядчиков для мероприятий по городу, дате и бюджету",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body>
        <LocaleProvider initialLocale={locale} key={locale}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
