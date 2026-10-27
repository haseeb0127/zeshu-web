"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CustomerLanguageCode = "en" | "te" | "hi" | "ur";

type CustomerLanguageContextValue = {
  language: CustomerLanguageCode;
  setLanguage: (language: CustomerLanguageCode) => void;
  t: (english: string) => string;
  direction: "ltr" | "rtl";
};

const STORAGE_KEY = "zeshu.customer.language";

const LANGUAGE_OPTIONS: Array<{ code: CustomerLanguageCode; label: string; short: string }> = [
  { code: "en", label: "English", short: "EN" },
  { code: "te", label: "తెలుగు", short: "తె" },
  { code: "hi", label: "हिन्दी", short: "हि" },
  { code: "ur", label: "اردو", short: "اردو" },
];

// English requires no dictionary; load other locales only on demand.
// Previously ~195 KB of translations was shipped in every first-page client chunk.
type Dictionary = Record<string,string>;
const dictionaryLoaders:Record<Exclude<CustomerLanguageCode,'en'>,()=>Promise<Dictionary>>={
 te:()=>import('./customer-translations/te').then(module=>module.default),
 hi:()=>import('./customer-translations/hi').then(module=>module.default),
 ur:()=>import('./customer-translations/ur').then(module=>module.default),
};

const CustomerLanguageContext = createContext<CustomerLanguageContextValue | null>(null);

function detectDeviceLanguage(): CustomerLanguageCode {
  if (typeof navigator === "undefined") return "en";
  const values = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const value of values) {
    const code = String(value || "").toLowerCase().split("-")[0];
    if (code === "te" || code === "hi" || code === "ur" || code === "en") return code;
  }
  return "en";
}

function applyDocumentLanguage(language: CustomerLanguageCode) {
  if (typeof document === "undefined") return;
  const direction = language === "ur" ? "rtl" : "ltr";
  document.documentElement.lang = language;
  document.documentElement.dir = direction;
  document.body.dir = direction;
  document.body.dataset.customerLanguage = language;
}

export function CustomerLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<CustomerLanguageCode>("en");
  const [translations, setTranslations] = useState<Partial<Record<CustomerLanguageCode,Dictionary>>>({en:{}});
  const loadTranslations=useCallback((next:CustomerLanguageCode)=>{
    if(next==='en')return;
    void dictionaryLoaders[next]().then(dict=>{
      setTranslations(previous=>previous[next]?previous:{...previous,[next]:dict});
    }).catch(()=>{
      // English fallback remains usable if a slow/offline device cannot load
      // its localised chunk. Switching locale later will retry.
    });
  },[]);

  useEffect(()=>{loadTranslations(language);},[language,loadTranslations]);

  useEffect(() => {
    let next = detectDeviceLanguage();
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as CustomerLanguageCode | null;
      if (saved && LANGUAGE_OPTIONS.some((option) => option.code === saved)) next = saved;
    } catch {
      // Device language remains the fallback in private/restricted browser contexts.
    }
    // Apply language and direction before waiting for a second render so Urdu
    // does not flash LTR on reload or inside the Android shell.
    applyDocumentLanguage(next);
    setLanguageState(next);
  }, []);

  useEffect(() => {
    applyDocumentLanguage(language);
  }, [language]);

  const setLanguage = useCallback((next: CustomerLanguageCode) => {
    // Make language selection visually immediate, especially for Urdu RTL.
    applyDocumentLanguage(next);
    setLanguageState(next);
    loadTranslations(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Local storage may be unavailable in private/restricted browser contexts.
    }
  }, [loadTranslations]);

  const t = useCallback((english: string) => translations[language]?.[english] || english, [language,translations]);
  const direction: "ltr" | "rtl" = language === "ur" ? "rtl" : "ltr";
  const value = useMemo(() => ({ language, setLanguage, t, direction }), [direction, language, setLanguage, t]);

  return <CustomerLanguageContext.Provider value={value}>{children}</CustomerLanguageContext.Provider>;
}

export function useCustomerLanguage() {
  const context = useContext(CustomerLanguageContext);
  if (!context) throw new Error("useCustomerLanguage must be used inside CustomerLanguageProvider");
  return context;
}

export function LanguageSwitcher({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const { language, setLanguage, t } = useCustomerLanguage();
  return (
    <label className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-black text-slate-700 shadow-sm ${className}`}>
      <span aria-hidden="true" className="text-sm">🌐</span>
      <select
        aria-label={t("Choose language")}
        value={language}
        onChange={(event) => setLanguage(event.target.value as CustomerLanguageCode)}
        className="max-w-[96px] bg-transparent text-xs font-black outline-none"
      >
        {LANGUAGE_OPTIONS.map((option) => <option key={option.code} value={option.code}>{compact ? option.short : option.label}</option>)}
      </select>
    </label>
  );
}
