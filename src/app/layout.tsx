import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Barlow, Barlow_Condensed } from 'next/font/google'
import './globals.css'

/* ── Fonts ─────────────────────────────────────────────────────────
 * Bebas Neue   → headlines (Tailwind: font-headline)
 * Barlow Condensed → subheadings (Tailwind: font-subheading)
 * Barlow       → body text (Tailwind: font-body, default)
 * ─────────────────────────────────────────────────────────────── */
const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const barlowCondensed = Barlow_Condensed({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-barlow-condensed',
  display: 'swap',
})

const barlow = Barlow({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Centumania — Winning is a habit',
  description: 'Discipline-first LDC/UDC government exam prep for Puducherry students.',
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,  // Prevent zoom on form focus (mobile UX)
  themeColor: '#0A0A0A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${barlowCondensed.variable} ${barlow.variable}`}
    >
      <body className="bg-carbon text-offwhite font-body antialiased">
        {children}
      </body>
    </html>
  )
}
