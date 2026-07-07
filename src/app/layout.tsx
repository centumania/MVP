import type { Metadata, Viewport } from 'next'
import { Inter, Bebas_Neue } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'

/**
 * Inter — body, numeric text, UI labels.
 * Bebas Neue — screen titles, timer, major section headings.
 * Both exposed as CSS variables for use in globals.css @theme.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  variable: '--font-bebas-neue',
  display: 'swap',
  weight: ['400'],
})

// Resolves relative OG/Twitter image URLs to absolute ones. Prefers an explicit
// site URL; falls back to Vercel's auto-injected deployment URL, then localhost.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

const DESCRIPTION =
  "Disciplined daily preparation for India's competitive government exams — SSC (CGL, CHSL, MTS, CPO), RRB (NTPC, Group D), Banking and Tamil Nadu & Puducherry state exams. Daily timed tests, AI mentor coaching, a live leaderboard and a performance-linked refund guarantee. More exams coming soon."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:  'CentuMania — Winning is a Habit',
    template: '%s • CentuMania',
  },
  description: DESCRIPTION,
  applicationName: 'CentuMania',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable:        true,
    statusBarStyle: 'default',
    title:          'CentuMania',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type:        'website',
    title:       'CentuMania — Winning is a Habit',
    description: DESCRIPTION,
    siteName:    'CentuMania',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'CentuMania — disciplined government exam preparation' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'CentuMania — Winning is a Habit',
    description: DESCRIPTION,
    images:      ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  width:           'device-width',
  initialScale:    1,
  // maximumScale intentionally not set — locking zoom violates WCAG 1.4.4
  viewportFit:     'cover',
  themeColor:      [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF8' },
    { media: '(prefers-color-scheme: dark)',  color: '#FAFAF8' },
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
      className={`${inter.variable} ${bebasNeue.variable}`}
    >
      <body className="bg-[#FAFAF8] text-[#111827] font-sans antialiased" suppressHydrationWarning>
        {/* Skip-to-content link — WCAG 2.1 SC 2.4.1 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:outline-none"
          style={{ background: '#0284c7', color: '#FFFFFF' }}
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}
