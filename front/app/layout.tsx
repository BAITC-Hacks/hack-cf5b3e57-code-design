import type { Metadata, Viewport } from "next";
import "@fontsource-variable/onest";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { getRequestLocale } from "@/lib/i18n/get-request-locale";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_TITLE = "ToiMatch — подбор подрядчиков для мероприятий в Казахстане";
const SITE_DESCRIPTION =
  "Подбор event-подрядчиков в Алматы и Астане: ведущие, фотографы, декораторы, музыканты и залы. Три варианта под вашу дату и бюджет — и почему именно они.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · ToiMatch",
  },
  description: SITE_DESCRIPTION,
  applicationName: "ToiMatch",
  authors: [{ name: "Code & Design" }],
  creator: "Code & Design",
  publisher: "ToiMatch",
  keywords: [
    "ToiMatch",
    "подрядчики для мероприятий",
    "event-подрядчики Казахстан",
    "подбор подрядчиков",
    "ведущий на той",
    "ведущий на свадьбу Алматы",
    "ведущий Астана",
    "фотограф на свадьбу",
    "видеограф на мероприятие",
    "декоратор мероприятий",
    "флорист",
    "лайв-бэнд",
    "залы для тоя",
    "организация тоя",
    "корпоратив Алматы",
    "той Астана",
    "мердігерлер",
    "event contractors Kazakhstan",
  ],
  category: "events",
  // og:title / og:description (and the Twitter equivalents) are filled from
  // each page's own title and description; images come from the
  // opengraph-image.png / twitter-image.png file conventions in this folder.
  openGraph: {
    type: "website",
    siteName: "ToiMatch",
    locale: "ru_RU",
    alternateLocale: ["kk_KZ", "en_US"],
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  appleWebApp: {
    capable: true,
    title: "ToiMatch",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFF8F0",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
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
