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
    if (ios || android) setVisible(true);

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
    if (!promptEvent) {
      setShowIosHelp(true);
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") {
      localStorage.setItem("alobeidi_app_installed", "1");
      setVisible(false);
    }
    setPromptEvent(null);
  }

  function confirmInstalled() {
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
        className="fixed bottom-40 left-4 z-[75] grid size-14 place-items-center rounded-full border-2 border-white bg-[#55434c] text-white shadow-xl transition active:scale-90 md:hidden"
      >
        <Download className="size-7" />
      </button>

      {showIosHelp && (
        <div className="fixed inset-0 z-[100] grid place-items-end bg-black/40 p-4 md:hidden" onClick={() => setShowIosHelp(false)}>
          <section dir="rtl" className="w-full rounded-3xl bg-white p-5 text-[#55434c] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/favicon.jpg" alt="شعار العبيدي" className="size-14 rounded-2xl object-cover" />
                <div><b className="block">تثبيت العبيدي لأناقة طفلك</b><small>{isIos ? "على شاشة الآيفون الرئيسية" : "على هاتف الأندرويد"}</small></div>
              </div>
              <button type="button" onClick={() => setShowIosHelp(false)} className="rounded-full bg-gray-100 p-2" aria-label="إغلاق"><X /></button>
            </div>
            {isIos ? (
              <ol className="mt-5 space-y-3 rounded-2xl bg-[#fff9fb] p-4 font-bold">
                <li className="flex gap-2"><Share2 className="shrink-0 text-[#b56d86]" /> 1- اضغط زر المشاركة في Safari.</li>
                <li>2- اختر «إضافة إلى الشاشة الرئيسية».</li>
                <li>3- اضغط «إضافة».</li>
              </ol>
            ) : (
              <ol className="mt-5 space-y-3 rounded-2xl bg-[#fff9fb] p-4 font-bold">
                <li>1- اضغط قائمة Chrome ذات النقاط الثلاث ⋮.</li>
                <li>2- اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</li>
                <li>3- اضغط «تثبيت».</li>
              </ol>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={confirmInstalled} className="rounded-2xl bg-[#55434c] px-4 py-3 font-black text-white">تم التثبيت</button>
              <button type="button" onClick={() => setShowIosHelp(false)} className="rounded-2xl bg-gray-100 px-4 py-3 font-bold">لاحقاً</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
