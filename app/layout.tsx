import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#d58fa7",
};

export const metadata: Metadata = {
  title: "العبيدي لأناقة طفلك | ملابس ومستلزمات الأطفال",
  description: "متجر العبيدي لأناقة طفلك في بغداد – الكاظمية، لملابس ومستلزمات الأطفال وحديثي الولادة.",
  applicationName: "العبيدي لأناقة طفلك",
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
        <Script id="remove-old-pwa" strategy="afterInteractive">
          {`
            if ("serviceWorker" in navigator) {
              navigator.serviceWorker.getRegistrations()
                .then((registrations) => registrations.forEach((registration) => registration.unregister()))
                .catch(() => undefined);
            }
            if ("caches" in window) {
              caches.keys()
                .then((keys) => Promise.all(
                  keys
                    .filter((key) => key.startsWith("alobeidi-store-"))
                    .map((key) => caches.delete(key))
                ))
                .catch(() => undefined);
            }
            localStorage.removeItem("alobeidi_app_installed");
            localStorage.removeItem("alobeidi_app_installed_v2");
          `}
        </Script>
      </body>
    </html>
  );
}
