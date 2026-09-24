"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

const INSTALLED_KEY = "alobeidi_app_installed_v2";

export function InstallApp() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;

    localStorage.removeItem("alobeidi_app_installed");
    const installed = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    if (installed) {
      localStorage.setItem(INSTALLED_KEY, "1");
      return;
    }
    const ua = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const android = /android/.test(ua);
    setIsIos(ios);
    setVisible(ios);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      setVisible(true);
    };
    const installedHandler = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      setVisible(false);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  async function install() {
    if (isIos) {
      if (navigator.share) {
        await navigator.share({
          title: "العبيدي لأناقة طفلك",
          text: "إضافة متجر العبيدي إلى الشاشة الرئيسية",
          url: window.location.origin,
        }).catch(() => undefined);
      }
      return;
    }

    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        localStorage.setItem(INSTALLED_KEY, "1");
      }
      setVisible(false);
      setPromptEvent(null);
    }
  }

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={install}
      aria-label="تثبيت تطبيق العبيدي لأناقة طفلك"
      title="تثبيت التطبيق"
      className="fixed bottom-40 left-4 z-[75] grid size-14 place-items-center rounded-full border-2 border-white bg-[#55434c] text-white shadow-xl transition active:scale-90 md:hidden"
    >
      <Download className="size-7" />
    </button>
  );
}
