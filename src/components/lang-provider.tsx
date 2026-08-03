"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DICT, DEFAULT_LANG, type Lang, type Dict } from "@/lib/i18n";

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
};

const Ctx = createContext<LangCtx>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: DICT[DEFAULT_LANG],
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  // Sunucu ve ilk client render'ı aynı (DEFAULT_LANG) → hydration uyumu.
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    let next: Lang | null = null;
    const stored = localStorage.getItem("lang");
    if (stored && stored in DICT) {
      next = stored as Lang;
    } else {
      const nav = navigator.language.slice(0, 2).toLowerCase();
      if (nav in DICT) next = nav as Lang;
    }
    if (next && next !== DEFAULT_LANG) setLangState(next);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
      document.cookie = `lang=${l};path=/;max-age=31536000;samesite=lax`;
    } catch {
      /* localStorage kapalıysa yok say */
    }
  };

  return (
    <Ctx.Provider value={{ lang, setLang, t: DICT[lang] }}>
      {children}
    </Ctx.Provider>
  );
}

export const useLang = () => useContext(Ctx);
