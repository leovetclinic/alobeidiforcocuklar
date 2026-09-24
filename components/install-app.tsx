"use client";

import { Download, Share2, X } from "lucide-react";
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

export function InstallApp() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const installed = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    if (installed) {
      localStorage.setItem("alobeidi_app_installed", "1");
      return;
    }
    if (localStorage.getItem("alobeidi_app_installed") === "1") return;

    const ua = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const android = /android/.test(ua);
    setIsIos(ios);
    if (ios) setVisible(true);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      if (android) setVisible(true);
    };
    const installedHandler = () => {
      localStorage.setItem("alobeidi_app_installed", "1");
      setVisible(false);
      setShowIosHelp(false);
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
      setShowIosHelp(true);
      return;
    }
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") {
      localStorage.setItem("alobeidi_app_installed", "1");
      setVisible(false);
    }
    setPromptEvent(null);
  }

  function confirmIosInstalled() {
    localStorage.setItem("alobeidi_app_installed", "1");
    setShowIosHelp(false);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <>
      <button
        type="button"
        onClick={install}
        aria-label="تثبيت تطبيق العبيدي لأناقة طفلك"
        className="fixed bottom-28 right-4 z-[70] flex items-center gap-2 rounded-full bg-[#55434c] px-4 py-3 font-black text-white shadow-2xl transition active:scale-95 md:hidden"
      >
        <Download className="size-5" />
        <span>تثبيت التطبيق</span>
      </button>

      {showIosHelp && (
        <div className="fixed inset-0 z-[100] grid place-items-end bg-black/40 p-4 md:hidden" onClick={() => setShowIosHelp(false)}>
          <section dir="rtl" className="w-full rounded-3xl bg-white p-5 text-[#55434c] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/favicon.jpg" alt="شعار العبيدي" className="size-14 rounded-2xl object-cover" />
                <div><b className="block">تثبيت العبيدي لأناقة طفلك</b><small>على شاشة الآيفون الرئيسية</small></div>
              </div>
              <button type="button" onClick={() => setShowIosHelp(false)} className="rounded-full bg-gray-100 p-2" aria-label="إغلاق"><X /></button>
            </div>
            <ol className="mt-5 space-y-3 rounded-2xl bg-[#fff9fb] p-4 font-bold">
              <li className="flex gap-2"><Share2 className="shrink-0 text-[#b56d86]" /> 1- اضغط زر المشاركة في Safari.</li>
              <li>2- اختر «إضافة إلى الشاشة الرئيسية».</li>
              <li>3- اضغط «إضافة».</li>
            </ol>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={confirmIosInstalled} className="rounded-2xl bg-[#55434c] px-4 py-3 font-black text-white">تمت الإضافة</button>
              <button type="button" onClick={() => setShowIosHelp(false)} className="rounded-2xl bg-gray-100 px-4 py-3 font-bold">لاحقاً</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
