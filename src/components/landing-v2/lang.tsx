'use client'

/**
 * Landing language context — English / Tamil.
 *
 * Source of truth is localStorage `cm_lang` (written by the /welcome gate and
 * by the floating EN/தமிழ் pill). The provider lives in LandingGate, so the
 * pill and every landing section share one live value — switching language
 * re-renders the page instantly, no reload.
 *
 * Sections read it via `useLang()` and translate with the `t(en, ta)` helper:
 *   const { t } = useLang()
 *   <h2>{t('Hard work isn't the problem.', 'உழைப்பு பிரச்சனை இல்லை.')}</h2>
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type Lang = 'en' | 'ta'

export function readStoredLang(): Lang {
  try { return localStorage.getItem('cm_lang') === 'ta' ? 'ta' : 'en' } catch { return 'en' }
}

type LangCtx = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (en: string, ta: string) => string
}

const Ctx = createContext<LangCtx>({ lang: 'en', setLang: () => {}, t: en => en })

export function LangProvider({ children, ssr = false }: { children: React.ReactNode; ssr?: boolean }) {
  // Safe to read localStorage in the initializer: LandingGate only mounts its
  // subtree client-side after the routing decision, so this never runs on the
  // server and never causes a hydration mismatch.
  // Server-rendered pages (e.g. /pilot) pass `ssr` instead: they hydrate in
  // English and switch to the stored language once mounted.
  const [lang, setLangState] = useState<Lang>(() => (ssr ? 'en' : readStoredLang()))

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only
    if (ssr) setLangState(readStoredLang())
  }, [ssr])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('cm_lang', l) } catch { /* ignore */ }
  }, [])

  const t = useCallback((en: string, ta: string) => (lang === 'ta' ? ta : en), [lang])

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export function useLang(): LangCtx {
  return useContext(Ctx)
}
