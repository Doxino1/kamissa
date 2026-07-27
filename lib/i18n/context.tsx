"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dictionary, Locale, LOCALES, dictionaries } from "./dictionary";

const STORAGE_KEY = "kamissa:locale";

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "fr";
  const lang = navigator.language.slice(0, 2).toLowerCase();
  return (LOCALES as string[]).includes(lang) ? (lang as Locale) : "fr";
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

// L'état initial doit être identique entre le rendu serveur et le premier
// rendu client ("fr", comme <html lang="fr">) sinon React déclenche une
// erreur d'hydratation — le localStorage/la préférence en base ne peuvent
// être lus qu'après le montage, dans l'effet ci-dessous.
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    let active = true;

    async function init() {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && (LOCALES as string[]).includes(stored)) {
        if (active) setLocaleState(stored as Locale);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;
      if (!user) {
        setLocaleState(detectBrowserLocale());
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("langue_preferee")
        .eq("id", user.id)
        .single();

      if (!active) return;
      const preferred = data?.langue_preferee;
      setLocaleState(
        preferred && (LOCALES as string[]).includes(preferred) ? (preferred as Locale) : detectBrowserLocale()
      );
    }

    init();
    return () => {
      active = false;
    };
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").update({ langue_preferee: next }).eq("id", user.id).then();
    });
  }

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: dictionaries[locale] }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}

export function useT() {
  return useLocale().t;
}
