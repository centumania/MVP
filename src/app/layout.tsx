import type { Metadata, Viewport } from 'next'
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['400', '600', '900'],
})

const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: 'CentuMania — Winning is a habit',
  description: "India's most disciplined LDC/UDC exam prep platform. 15-day intensive programme for Puducherry competitive exam aspirants.",
  icons: {
    icon:  '/favicon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable:       true,
    statusBarStyle: 'black-translucent',
    title:         'CentuMania',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width:           'device-width',
  initialScale:    1,
  maximumScale:    1,
  viewportFit:     'cover',
  themeColor:      [
    { media: '(prefers-color-scheme: dark)',  color: '#0e1410' },
    { media: '(prefers-color-scheme: light)', color: '#0e1410' },
  ],
}

/**
 * RootLayout — Server Component (async to read request headers).
 *
 * Reads the CSP nonce from the x-nonce request header set by src/proxy.ts.
 * Setting nonce on <html> tells Next.js to propagate it to all inline
 * scripts it generates (hydration, RSC payloads).
 *
 * suppressHydrationWarning is required on <html> and <body> because the
 * nonce is a random value generated fresh per request. The server renders
 * with a real nonce; React's client-side rehydration sees "" (headers()
 * is server-only). This mismatch is intentional and safe — suppressHydrationWarning
 * tells React not to patch it up, which is exactly correct for nonces.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers()
  const nonce = headerStore.get('x-nonce') ?? '' // set by src/proxy.ts per request

  return (
    <html
      lang="en"
      nonce={nonce || undefined}
      suppressHydrationWarning
      className={`${fraunces.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-bg text-text font-sans antialiased" suppressHydrationWarning>
        {/* Skip-to-content link — WCAG 2.1 SC 2.4.1 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:outline-none"
          style={{ background: '#4ADE80', color: '#06140c' }}
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}
