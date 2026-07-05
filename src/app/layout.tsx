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

export const metadata: Metadata = {
  title: 'CentuMania — Winning is a habit',
  description: "India's most disciplined LDC/UDC exam prep platform. Intensive daily programme for Puducherry LDC/UDC competitive exam aspirants.",
  icons: {
    icon:  '/favicon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable:        true,
    statusBarStyle: 'black-translucent',
    title:          'CentuMania',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type:        'website',
    title:       'CentuMania — Winning is a habit',
    description: "India's most disciplined LDC/UDC exam prep platform. Intensive daily programme for Puducherry competitive exam aspirants.",
    siteName:    'CentuMania',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'CentuMania' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'CentuMania — Winning is a habit',
    description: "India's most disciplined LDC/UDC exam prep platform.",
    images:      ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  width:           'device-width',
  initialScale:    1,
  // maximumScale intentionally not set — locking zoom violates WCAG 1.4.4
  viewportFit:     'cover',
  themeColor:      [
    { media: '(prefers-color-scheme: light)', color: '#0B1020' },
    { media: '(prefers-color-scheme: dark)',  color: '#0B1020' },
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
      <body className="bg-cm-carbon text-cm-neutral-50 font-sans antialiased" suppressHydrationWarning>
        {/* Skip-to-content link — WCAG 2.1 SC 2.4.1 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold focus:outline-none"
          style={{ background: '#2533FF', color: '#F9FAFB' }}
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}
