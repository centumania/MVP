import Link from 'next/link'
import Logo from '@/src/components/landing-v2/Logo'

/**
 * PublicPage — shared shell for public/legal pages (about, contact,
 * privacy, terms, refund). v2 light design system; the .pub-main content
 * classes keep their names so page bodies need no changes.
 */
const CSS = `
.pub{min-height:100vh;background:#FAFAF8;color:#111827;font-family:var(--font-inter),'Inter',system-ui,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;}
.pub a{color:inherit;text-decoration:none;}
.pub-nav{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(16,24,40,.08);padding:0 5%;height:64px;display:flex;align-items:center;justify-content:space-between;}
.pub-brand{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:700;letter-spacing:-.02em;color:#111827;}
.pub-brand em{color:#0284c7;font-style:normal;}
.pub-back{font-size:13px;font-weight:500;color:#6B7280;display:flex;align-items:center;gap:6px;transition:color .15s;}
.pub-back:hover{color:#111827;}
.pub-main{max-width:760px;margin:0 auto;padding:64px 5% 100px;}
.pub-main h1{font-size:clamp(32px,4.5vw,44px);font-weight:800;letter-spacing:-.03em;line-height:1.1;color:#111827;margin-bottom:10px;}
.pub-eyebrow{display:inline-flex;align-items:center;font-size:12px;font-weight:600;letter-spacing:.02em;color:#0369a1;background:#f0f9ff;border:1px solid rgba(2,132,199,.20);border-radius:999px;padding:4px 12px;margin-bottom:18px;}
.pub-lead{font-size:17px;color:#4B5563;margin-bottom:48px;line-height:1.7;border-bottom:1px solid rgba(16,24,40,.08);padding-bottom:40px;}
.pub-main h2{font-size:19px;font-weight:700;letter-spacing:-.01em;color:#111827;margin:36px 0 12px;}
.pub-main h3{font-size:15.5px;font-weight:700;color:#1F2937;margin:24px 0 8px;}
.pub-main p{font-size:14.5px;color:#4B5563;line-height:1.75;margin-bottom:14px;}
.pub-main ul{padding-left:20px;margin-bottom:14px;}
.pub-main li{font-size:14.5px;color:#4B5563;line-height:1.75;margin-bottom:6px;}
.pub-main strong{color:#111827;font-weight:600;}
.pub-main a{color:#0284c7;font-weight:600;}
.pub-main a:hover{color:#0369a1;}
.pub-foot{border-top:1px solid rgba(16,24,40,.08);margin-top:60px;padding-top:24px;font-size:12.5px;color:#9CA3AF;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.pub-foot a{color:#6B7280;font-weight:500;}
.pub-foot a:hover{color:#111827;}
@media(max-width:767px){
  .pub-main{padding:40px 5% 80px;}
  .pub-lead{font-size:15px;margin-bottom:32px;padding-bottom:28px;}
  .pub-main h2{font-size:17px;margin:28px 0 10px;}
  .pub-foot{flex-direction:column;gap:8px;text-align:center;}
}
`

export function PublicPage({ eyebrow, title, lead, children }: {
  eyebrow: string
  title: string
  lead?: string
  children: React.ReactNode
}) {
  return (
    <div className="pub">
      <style>{CSS}</style>

      <nav className="pub-nav">
        <Link href="/" className="pub-brand">
          <Logo size={34} />
          <span>Centu<em>Mania</em></span>
        </Link>
        <Link href="/" className="pub-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
          Back to home
        </Link>
      </nav>

      <main className="pub-main">
        <span className="pub-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {lead && <p className="pub-lead">{lead}</p>}
        {children}
        <div className="pub-foot">
          <span>© 2026 CentuMania. All rights reserved.</span>
          <span>
            <Link href="/privacy" style={{marginRight:16}}>Privacy Policy</Link>
            <Link href="/terms" style={{marginRight:16}}>Terms</Link>
            <Link href="/refund">Refund Policy</Link>
          </span>
        </div>
      </main>
    </div>
  )
}
