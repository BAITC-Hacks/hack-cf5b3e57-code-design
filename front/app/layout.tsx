import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HackAlem Admin",
    template: "%s · HackAlem Admin",
  },
  description: "Управление каталогом подрядчиков HackAlem",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
