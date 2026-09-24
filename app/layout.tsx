import type { Metadata, Viewport } from "next";
import { InstallApp } from "@/components/install-app";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#d58fa7",
};

export const metadata: Metadata = {
  title: "العبيدي لأناقة طفلك | ملابس ومستلزمات الأطفال",
  description: "متجر العبيدي لأناقة طفلك في بغداد – الكاظمية، لملابس ومستلزمات الأطفال وحديثي الولادة.",
  applicationName: "العبيدي لأناقة طفلك",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "العبيدي لأناقة طفلك",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/favicon.jpg", type: "image/jpeg" }],
    shortcut: "/favicon.jpg",
    apple: "/favicon.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        {children}
        <InstallApp />
      </body>
    </html>
  );
}
