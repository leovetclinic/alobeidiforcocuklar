import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "العبيدي لأناقة طفلك | ملابس ومستلزمات الأطفال",
  description: "متجر العبيدي لأناقة طفلك في بغداد – الكاظمية، لملابس ومستلزمات الأطفال وحديثي الولادة.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
