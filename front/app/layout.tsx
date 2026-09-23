import type { Metadata } from "next";
import "@fontsource-variable/onest";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ToiMatch — подбор подрядчиков",
    template: "ToiMatch — %s",
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
          <SiteHeader />
          <div id="site-content" tabIndex={-1}>{children}</div>
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
