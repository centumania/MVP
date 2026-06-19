import Link from 'next/link'

const CSS = `
.pub {
  --carbon:#0B1020;--carbon-soft:#111827;--carbon-mid:#0d1525;
  --indigo:#2533FF;--gold:#F6B300;--teal:#0EA5A0;
  --n50:#F9FAFB;--n100:#E5E7EB;--n300:#9CA3AF;--n500:#6B7280;--n700:#4B5563;
  --border:rgba(255,255,255,0.08);
  min-height:100vh;background:var(--carbon);color:var(--n50);
  font-family:'Inter',system-ui,sans-serif;line-height:1.6;
}
.pub a{color:inherit;text-decoration:none;}
.pub-nav{position:sticky;top:0;z-index:50;background:rgba(11,16,32,.92);
  backdrop-filter:blur(16px);border-bottom:1px solid var(--border);
  padding:0 5%;height:60px;display:flex;align-items:center;justify-content:space-between;}
.pub-logo{font-family:'Bebas Neue','Impact',sans-serif;font-size:24px;letter-spacing:.08em;color:var(--gold);}
.pub-logo em{color:var(--n50);font-style:normal;}
.pub-back{font-size:13px;color:var(--n300);display:flex;align-items:center;gap:6px;transition:color .15s;}
.pub-back:hover{color:var(--n50);}
.pub-main{max-width:760px;margin:0 auto;padding:60px 5% 100px;}
.pub-main h1{font-family:'Bebas Neue','Impact',sans-serif;font-size:clamp(36px,5vw,56px);
  letter-spacing:.04em;line-height:1;color:var(--n50);margin-bottom:8px;}
.pub-eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;
  color:var(--indigo);margin-bottom:16px;display:block;}
.pub-lead{font-size:17px;color:var(--n300);margin-bottom:48px;line-height:1.7;
  border-bottom:1px solid var(--border);padding-bottom:40px;}
.pub-main h2{font-size:18px;font-weight:700;color:var(--n50);margin:36px 0 12px;}
.pub-main h3{font-size:15px;font-weight:700;color:var(--n100);margin:24px 0 8px;}
.pub-main p{font-size:14px;color:var(--n300);line-height:1.75;margin-bottom:14px;}
.pub-main ul{padding-left:20px;margin-bottom:14px;}
.pub-main li{font-size:14px;color:var(--n300);line-height:1.75;margin-bottom:6px;}
.pub-main strong{color:var(--n100);font-weight:600;}
.pub-foot{border-top:1px solid var(--border);margin-top:60px;padding-top:24px;
  font-size:12px;color:var(--n700);display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.pub-foot a{color:var(--n500);}
.pub-foot a:hover{color:var(--n50);}
@media(max-width:767px){
  .pub-main{padding:36px 5% 80px;}
  .pub-lead{font-size:15px;margin-bottom:32px;padding-bottom:28px;}
  .pub-main h2{font-size:16px;margin:28px 0 10px;}
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
        <Link href="/" className="pub-logo"><em>Centu</em>Mania</Link>
        <Link href="/" className="pub-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
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
