'use client'

/**
 * App-mode detection — is the web app running inside the CentuMania native
 * (Capacitor) shell, as opposed to a normal browser?
 *
 * WHY THIS EXISTS: Google Play's Payments policy forbids leading users to any
 * payment method other than Google Play Billing *inside* an app. CentuMania is
 * a "consumption-only" app — you subscribe on the website, the app only unlocks
 * once verified. So when we're inside the native shell, every purchase surface
 * (the /payment UPI screen, the "Payment" nav item, classroom pay CTAs) must be
 * hidden. This helper is the single switch that drives that.
 *
 * Two independent signals, so it works even if one is unavailable:
 *   1. Capacitor injects `window.Capacitor` and `isNativePlatform()` returns true
 *      inside the app WebView.
 *   2. The Capacitor config appends `CentuManiaApp` to the WebView user-agent
 *      (see capacitor.config.ts `appendUserAgent`), so UA sniffing is a fallback.
 */
import { useEffect, useState } from 'react'

interface CapacitorWindow {
  Capacitor?: { isNativePlatform?: () => boolean }
}

/** Synchronous check. Returns false during SSR (no window). Client-only truth. */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as unknown as CapacitorWindow).Capacitor
  if (cap?.isNativePlatform?.() === true) return true
  return typeof navigator !== 'undefined' && /CentuManiaApp/i.test(navigator.userAgent || '')
}

/**
 * SSR-safe hook. Returns `null` until mounted (matches the server render, so no
 * hydration mismatch), then the real boolean. Callers that must be safe-by-default
 * (e.g. the payment page) should treat `null` as "not yet known" and withhold any
 * purchase UI until it resolves to `false`.
 */
export function useIsNativeApp(): boolean | null {
  const [native, setNative] = useState<boolean | null>(null)
  useEffect(() => { setNative(isNativeApp()) }, [])
  return native
}
