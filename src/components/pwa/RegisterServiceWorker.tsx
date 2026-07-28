'use client'

/**
 * Registers /sw.js so Chrome considers CentuMania installable (Add to Home
 * Screen / desktop install). Mounted once from the root layout.
 * Skipped inside the native Capacitor app — that has its own asset pipeline
 * and doesn't need a browser service worker.
 */
import { useEffect } from 'react'
import { isNativeApp } from '@/src/lib/native/app-mode'

export function RegisterServiceWorker() {
  useEffect(() => {
    if (isNativeApp()) return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => { /* best-effort */ })
  }, [])
  return null
}
