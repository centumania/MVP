'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

function goto(id: string) {
  const el = document.getElementById(id)
  if (el) window.scrollTo({ top: el.offsetTop - 72, behavior: 'smooth' })
}

const CSS = `
.cm-landing {
  --carbon:#0B1020;--carbon-soft:#111827;--carbon-mid:#0d1525;
  --indigo:#2533FF;--indigo-hover:#1e28e0;--indigo-subtle:rgba(37,51,255,0.10);
  --indigo-border:rgba(37,51,255,0.30);--indigo-glow:rgba(37,51,255,0.25);
  --gold:#F6B300;--gold-subtle:rgba(246,179,0,0.12);--gold-border:rgba(246,179,0,0.35);
  --teal:#0EA5A0;--teal-subtle:rgba(14,165,160,0.10);
  --success:#22C55E;--success-subtle:rgba(34,197,94,0.12);--warning:#FBBF24;--streak:#F97316;
  --n50:#F9FAFB;--n100:#E5E7EB;--n300:#9CA3AF;--n500:#6B7280;--n700:#4B5563;
  --border:rgba(255,255,255,0.08);--border-strong:rgba(255,255,255,0.14);
}
.cm-landing a{text-decoration:none;color:inherit;}
.cm-landing .container{max-width:1120px;margin:0 auto;padding:0 5%;}
.cm-landing .section{padding:80px 5%;}
.cm-landing .section-alt{background:var(--carbon-mid);}
.label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:var(--n500);margin-bottom:10px;display:block;}
.label-indigo{color:var(--indigo);}.label-gold{color:var(--gold);}.label-teal{color:var(--teal);}
.heading-xl{font-family:var(--font-bebas,'Bebas Neue',sans-serif);font-size:clamp(48px,7vw,84px);line-height:1;letter-spacing:.03em;}
.heading-lg{font-family:var(--font-bebas,'Bebas Neue',sans-serif);font-size:clamp(32px,4vw,52px);line-height:1.05;letter-spacing:.03em;}
.section-heading{text-align:center;margin-bottom:8px;}
.section-sub{text-align:center;font-size:16px;color:var(--n300);max-width:540px;margin:0 auto 52px;line-height:1.65;}
.btn{display:inline-flex;align-items:center;gap:8px;font-weight:700;border-radius:10px;cursor:pointer;transition:all .15s;border:none;font-family:inherit;}
.btn-primary{background:var(--indigo);color:#fff;padding:14px 28px;font-size:15px;box-shadow:0 6px 20px var(--indigo-glow);}
.btn-primary:hover{background:var(--indigo-hover);transform:translateY(-1px);}
.btn-gold{background:var(--gold);color:var(--carbon);padding:14px 28px;font-size:15px;box-shadow:0 6px 20px rgba(246,179,0,.28);}
.btn-gold:hover{background:#e5a500;transform:translateY(-1px);}
.btn-ghost{background:var(--border);color:var(--n100);padding:13px 24px;font-size:14px;border:1px solid var(--border-strong);}
.btn-ghost:hover{background:rgba(255,255,255,.10);}
.btn-lg{padding:16px 36px;font-size:17px;border-radius:12px;}
.card{background:var(--carbon-soft);border:1px solid var(--border);border-radius:16px;padding:24px;}
.card:hover{border-color:var(--border-strong);}
.card-indigo{border-color:var(--indigo-border);background:rgba(37,51,255,.06);}
.card-gold{border-color:var(--gold-border);background:var(--gold-subtle);}
.card-teal{border-color:rgba(14,165,160,.30);background:var(--teal-subtle);}
.badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;}
.badge-indigo{background:var(--indigo-subtle);color:#818cf8;border:1px solid var(--indigo-border);}
.badge-gold{background:var(--gold-subtle);color:var(--gold);border:1px solid var(--gold-border);}
.badge-success{background:var(--success-subtle);color:var(--success);border:1px solid rgba(34,197,94,.30);}
.grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;}
.grid-3{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;}
.grid-4{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;}
.cm-landing nav{position:sticky;top:0;z-index:100;background:rgba(11,16,32,.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--border);padding:0 5%;height:64px;display:flex;align-items:center;justify-content:space-between;}
.nav-logo{font-family:var(--font-bebas,'Bebas Neue',sans-serif);font-size:26px;letter-spacing:.08em;color:var(--gold);}
.nav-logo em{color:var(--n50);font-style:normal;}
.nav-links{display:flex;gap:28px;font-size:14px;color:var(--n300);}
.cm-landing .nav-links a:hover{color:var(--n50);}
.nav-right{display:flex;align-items:center;gap:12px;}
.hero{padding:96px 5% 80px;text-align:center;position:relative;overflow:hidden;}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(900px 600px at 50% -10%,rgba(37,51,255,.18),transparent 60%),radial-gradient(600px 400px at 80% 80%,rgba(14,165,160,.08),transparent 50%);pointer-events:none;}
.cm-landing .hero h1{margin-bottom:10px;}
.cm-landing .hero h1 em{color:var(--gold);font-style:normal;}
.cm-landing .hero p{font-size:18px;color:var(--n300);max-width:560px;margin:0 auto 36px;line-height:1.65;}
.hero-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:48px;}
.countdown{display:inline-flex;align-items:center;gap:20px;background:var(--carbon-soft);border:1px solid var(--border-strong);border-radius:16px;padding:20px 32px;flex-wrap:wrap;justify-content:center;margin-bottom:52px;}
.cd-label{font-size:12px;color:var(--n500);font-weight:600;}
.cd-unit{text-align:center;}
.cd-num{font-family:var(--font-bebas,'Bebas Neue',sans-serif);font-size:40px;line-height:1;color:var(--gold);display:block;min-width:52px;letter-spacing:.04em;}
.cd-tag{font-size:10px;color:var(--n500);text-transform:uppercase;letter-spacing:.08em;font-weight:600;}
.cd-divider{font-family:var(--font-bebas,'Bebas Neue',sans-serif);font-size:32px;color:var(--n700);}
.hero-stats{display:flex;gap:48px;justify-content:center;flex-wrap:wrap;}
.hero-stat{text-align:center;}
.hero-stat-num{font-family:var(--font-bebas,'Bebas Neue',sans-serif);font-size:40px;color:var(--n50);line-height:1;letter-spacing:.04em;}
.hero-stat-num span{color:var(--indigo);}
.hero-stat-label{font-size:12px;color:var(--n500);font-weight:600;margin-top:4px;}
.fail-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;max-width:880px;margin:0 auto;}
.fail-col{padding:32px;}
.fail-col:first-child{border-right:1px solid var(--border);}
.fail-item{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--border);}
.fail-item:last-child{border-bottom:none;}
.fail-x{color:#E3413A;font-size:16px;font-weight:700;flex-shrink:0;margin-top:2px;}
.check-x{color:var(--success);font-size:16px;font-weight:700;flex-shrink:0;margin-top:2px;}
.fail-text{font-size:14px;color:var(--n300);line-height:1.6;}
.fail-col h3{font-family:var(--font-bebas,'Bebas Neue',sans-serif);font-size:22px;letter-spacing:.06em;margin-bottom:16px;}
.fail-col-bad h3{color:#E3413A;}.fail-col-good h3{color:var(--success);}
.test-card-hero{background:linear-gradient(135deg,#1a24e8 0%,var(--indigo) 60%,#0d1db8 100%);border-radius:20px;padding:32px;box-shadow:0 12px 40px var(--indigo-glow);max-width:480px;}
.test-timer{font-family:var(--font-bebas,'Bebas Neue',sans-serif);font-size:72px;line-height:1;letter-spacing:.06em;color:#fff;margin:8px 0;}
.test-feat{display:flex;gap:14px;align-items:flex-start;background:var(--carbon-soft);border:1px solid var(--border);border-radius:12px;padding:16px;}
.test-feat-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;background:var(--indigo-subtle);}
.test-feat h4{font-size:14px;font-weight:700;margin-bottom:3px;}
.cm-landing .test-feat p{font-size:13px;color:var(--n300);line-height:1.55;}
.leaderboard-preview{background:var(--carbon-soft);border:1px solid var(--border);border-radius:18px;overflow:hidden;max-width:560px;margin:0 auto;}
.lb-header{padding:16px 20px;background:rgba(37,51,255,.08);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;}
.lb-title{font-family:var(--font-bebas,'Bebas Neue',sans-serif);font-size:18px;letter-spacing:.06em;}
.lb-row{display:grid;grid-template-columns:40px 1fr 80px 80px;gap:12px;align-items:center;padding:14px 20px;border-bottom:1px solid var(--border);transition:background .1s;}
.lb-row:hover{background:rgba(255,255,255,.03);}
.lb-row:last-child{border-bottom:none;}
.lb-rank{font-family:var(--font-bebas,'Bebas Neue',sans-serif);font-size:20px;letter-spacing:.04em;color:var(--n500);text-align:center;}
.lb-rank.gold-rank{color:var(--gold);}.lb-rank.silver-rank{color:#94a3b8;}.lb-rank.bronze-rank{color:var(--streak);}
.lb-name{font-size:14px;font-weight:600;}
.lb-score{font-size:14px;font-weight:700;color:var(--success);text-align:right;}
.lb-streak{font-size:13px;color:var(--gold);text-align:right;}
.lb-you{background:var(--indigo-subtle);border-left:3px solid var(--indigo);}
.analytics-card{background:var(--carbon-soft);border:1px solid var(--border);border-radius:18px;padding:24px;height:100%;}
.analytics-card h4{font-size:13px;color:var(--n500);font-weight:600;margin-bottom:14px;text-transform:uppercase;letter-spacing:.08em;}
.big-stat{font-family:var(--font-bebas,'Bebas Neue',sans-serif);font-size:56px;line-height:1;letter-spacing:.04em;}
.progress-bar{height:6px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;margin-top:8px;}
.progress-fill{height:100%;background:linear-gradient(90deg,var(--indigo),var(--teal));border-radius:999px;}
.mini-bar-row{display:flex;align-items:center;gap:10px;margin-top:8px;}
.mini-bar-label{font-size:12px;color:var(--n300);min-width:80px;}
.mini-bar{flex:1;height:4px;background:rgba(255,255,255,.07);border-radius:999px;overflow:hidden;}
.mini-bar-fill{height:100%;border-radius:999px;}
.mini-bar-val{font-size:12px;color:var(--n300);min-width:36px;text-align:right;}
.refund-card{max-width:720px;margin:0 auto;background:var(--carbon-soft);border:1px solid var(--gold-border);border-radius:20px;padding:40px;}
.refund-card h3{font-family:var(--font-bebas,'Bebas Neue',sans-serif);font-size:32px;letter-spacing:.05em;margin-bottom:8px;}
.refund-conditions{display:flex;flex-direction:column;gap:10px;margin:24px 0;}
.refund-item{display:flex;gap:12px;align-items:flex-start;background:rgba(246,179,0,.05);border:1px solid rgba(246,179,0,.15);border-radius:10px;padding:14px;}
.refund-item span{font-size:16px;flex-shrink:0;}
.cm-landing .refund-item p{font-size:14px;color:var(--n100);line-height:1.55;}
.refund-disclaimer{font-size:12px;color:var(--n500);line-height:1.6;border-top:1px solid var(--border);padding-top:16px;}
.testi-card{background:var(--carbon-soft);border:1px solid var(--border);border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:16px;}
.testi-stars{color:var(--gold);font-size:14px;letter-spacing:2px;}
.testi-text{font-size:14px;color:var(--n100);line-height:1.7;flex:1;}
.testi-author{display:flex;align-items:center;gap:10px;}
.testi-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--indigo),var(--teal));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;}
.testi-name{font-size:14px;font-weight:700;}.testi-role{font-size:12px;color:var(--n500);}
.pricing-card{max-width:440px;margin:0 auto;background:var(--carbon-soft);border:2px solid var(--indigo-border);border-radius:24px;padding:40px;text-align:center;box-shadow:0 0 60px rgba(37,51,255,.12);}
.price-amount{font-family:var(--font-bebas,'Bebas Neue',sans-serif);font-size:80px;line-height:1;letter-spacing:.04em;color:var(--n50);}
.price-amount sup{font-size:32px;vertical-align:super;color:var(--n300);}
.price-period{font-size:14px;color:var(--n500);margin-bottom:28px;}
.price-features{list-style:none;text-align:left;display:flex;flex-direction:column;gap:10px;margin-bottom:32px;padding:0;}
.price-features li{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--n100);}
.price-features li::before{content:'✓';color:var(--success);font-weight:700;flex-shrink:0;}
.price-note{font-size:12px;color:var(--n500);margin-top:14px;}
.faq-list{max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:8px;}
.faq-item{background:var(--carbon-soft);border:1px solid var(--border);border-radius:12px;overflow:hidden;}
.faq-q{width:100%;padding:18px 20px;display:flex;justify-content:space-between;align-items:center;font-size:15px;font-weight:600;color:var(--n50);background:none;border:none;cursor:pointer;text-align:left;font-family:inherit;}
.faq-q:hover{background:rgba(255,255,255,.03);}
.faq-q .chevron{color:var(--n500);transition:transform .2s;flex-shrink:0;}
.faq-q.open .chevron{transform:rotate(180deg);}
.faq-a{padding:0 20px 18px;font-size:14px;color:var(--n300);line-height:1.7;}
.cta-section{padding:100px 5%;text-align:center;position:relative;overflow:hidden;}
.cta-section::before{content:'';position:absolute;inset:0;background:radial-gradient(800px 500px at 50% 50%,rgba(37,51,255,.15),transparent 65%);pointer-events:none;}
.cta-card{max-width:680px;margin:0 auto;background:var(--carbon-soft);border:1px solid var(--indigo-border);border-radius:24px;padding:56px 48px;box-shadow:0 0 80px rgba(37,51,255,.12);}
.cta-card h2{margin-bottom:14px;}
.cm-landing .cta-card p{font-size:17px;color:var(--n300);max-width:480px;margin:0 auto 36px;line-height:1.65;}
.cta-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
.cm-landing footer{background:var(--carbon-soft);border-top:1px solid var(--border);padding:40px 5%;}
.footer-inner{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:32px;margin-bottom:32px;}
.footer-brand .nav-logo{font-size:22px;}
.cm-landing .footer-brand p{font-size:13px;color:var(--n500);max-width:240px;margin-top:8px;line-height:1.6;}
.footer-links{display:flex;gap:40px;flex-wrap:wrap;}
.footer-col h4{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.10em;color:var(--n300);margin-bottom:14px;}
.cm-landing .footer-col a{display:block;font-size:13px;color:var(--n500);margin-bottom:8px;}
.cm-landing .footer-col a:hover{color:var(--n50);}
.footer-copy{border-top:1px solid var(--border);padding-top:24px;font-size:13px;color:var(--n700);text-align:center;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@media(max-width:767px){
  .cm-landing .nav-links{display:none;}
  .nav-sign-in{display:none;}
  .cm-landing .section{padding:60px 5%;}
  .hero{padding:64px 5% 56px;}
  .fail-grid{grid-template-columns:1fr;}
  .fail-col:first-child{border-right:none;border-bottom:1px solid var(--border);}
  .analytics-grid{grid-template-columns:1fr !important;}
  .cta-card{padding:36px 24px;}
  .pricing-card{padding:32px 24px;}
  .refund-card{padding:28px 20px;}
  .countdown{padding:16px 20px;gap:12px;}
  .cd-num{font-size:32px;}
  .test-layout,.lb-layout{grid-template-columns:1fr !important;}
  .lb-row{grid-template-columns:32px 1fr 60px;gap:8px;padding:12px 16px;}
  .lb-streak{display:none;}
  .footer-links{gap:16px 24px;}
  .footer-inner{gap:16px;}
  .section-sub{font-size:15px;}
}
@media(max-width:479px){
  .heading-xl{font-size:42px;}
  .hero-stats{gap:24px;}
  .hero-stat-num{font-size:32px;}
  .countdown{padding:12px 14px;gap:8px;}
  .cd-num{font-size:28px;min-width:40px;}
  .cd-divider{font-size:24px;}
  .btn-lg{padding:14px 28px;font-size:15px;}
  .nav-right .btn{font-size:13px;padding:8px 14px;}
  .price-amount{font-size:64px;}
}
`

const FAQS = [
  { q: "What if I miss a day's exam?", a: "If you miss the 6:00–8:30 AM window, that day's exam is automatically marked as missed. Your rank won't update for that day. Consecutive misses affect your streak. The programme rewards consistency — plan your schedule before you start." },
  { q: "Which exam is this specifically for?", a: "CentuMania is purpose-built for LDC (Lower Division Clerk) and UDC (Upper Division Clerk) government competitive exams. All content is calibrated to the actual exam syllabus and question pattern." },
  { q: "What language are the exams in?", a: "Exams are available in English and Tamil. You can switch your preferred language in account settings." },
  { q: "How does the refund work?", a: "If you attempt all daily exams, maintain an average below 50%, and apply within 7 days of programme completion — you get a full refund. Eligibility is verified automatically from your submission data. No arguments, no hassle." },
  { q: "Can I join mid-programme?", a: "No. Each batch starts on a fixed date and runs for a fixed duration. This structure is intentional — the leaderboard resets per batch. Join the next available batch to get the full experience and refund eligibility." },
  { q: "Is there a free trial?", a: "Day 1 of each batch is accessible to all registered users as a preview. You can attempt the first daily exam free of charge. Full programme access requires payment before Day 2 begins." },
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [cd, setCd] = useState({ d: '--', h: '--', m: '--', s: '--' })

  useEffect(() => {
    function tick() {
      const now = new Date()
      const t = new Date()
      const daysUntilMon = (1 - t.getDay() + 7) % 7 || 7
      t.setDate(t.getDate() + daysUntilMon)
      t.setHours(6, 0, 0, 0)
      const diff = Math.max(0, +t - +now)
      const pad = (n: number) => String(n).padStart(2, '0')
      setCd({ d: pad(Math.floor(diff / 864e5)), h: pad(Math.floor((diff % 864e5) / 36e5)), m: pad(Math.floor((diff % 36e5) / 6e4)), s: pad(Math.floor((diff % 6e4) / 1e3)) })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="cm-landing" style={{ backgroundColor: 'var(--carbon)', color: 'var(--n50)', fontFamily: 'var(--font-hanken,"Inter",system-ui,sans-serif)', overflowX: 'hidden', lineHeight: 1.6 }}>
      <style>{CSS}</style>

      {/* NAV */}
      <nav>
        <div className="nav-logo"><em>Centu</em>Mania</div>
        <div className="nav-links">
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <a href="#pricing" onClick={e=>{e.preventDefault();goto('pricing')}}>Pricing</a>
          <a href="#faq" onClick={e=>{e.preventDefault();goto('faq')}}>FAQ</a>
        </div>
        <div className="nav-right">
          <Link href="/auth/login" className="nav-sign-in" style={{color:'var(--n300)',fontSize:14,padding:'9px 16px',display:'inline-flex',alignItems:'center'}}>Sign In</Link>
          <Link href="/auth/register" className="btn btn-primary" style={{padding:'9px 20px',fontSize:14}}>Join the Program →</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <h1 className="heading-xl">Winning is<br /><em>a habit.</em></h1>
        <p>The most disciplined LDC / UDC exam prep. A structured intensive programme that transforms aspirants into exam-ready toppers.</p>
        <div className="hero-btns">
          <Link href="/auth/register" className="btn btn-gold btn-lg">Start the Programme →</Link>
        </div>
        <div className="countdown">
          <span className="cd-label">Next batch starts in</span>
          <div className="cd-unit"><span className="cd-num">{cd.d}</span><span className="cd-tag">Days</span></div>
          <span className="cd-divider">:</span>
          <div className="cd-unit"><span className="cd-num">{cd.h}</span><span className="cd-tag">Hours</span></div>
          <span className="cd-divider">:</span>
          <div className="cd-unit"><span className="cd-num">{cd.m}</span><span className="cd-tag">Min</span></div>
          <span className="cd-divider">:</span>
          <div className="cd-unit"><span className="cd-num">{cd.s}</span><span className="cd-tag">Sec</span></div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><div className="hero-stat-num">Live</div><div className="hero-stat-label">Leaderboard</div></div>
          <div className="hero-stat"><div className="hero-stat-num"><span>3</span>x</div><div className="hero-stat-label">Score Improvement</div></div>
        </div>
      </section>

      {/* WHY STUDENTS FAIL */}
      <section className="section">
        <div className="container">
          <span className="label" style={{textAlign:'center',display:'block'}}>The real problem</span>
          <h2 className="heading-lg section-heading">Why most aspirants don&apos;t make it</h2>
          <p className="section-sub">And exactly how CentuMania fixes each one.</p>
          <div className="card" style={{maxWidth:880,margin:'0 auto',padding:0,overflow:'hidden'}}>
            <div className="fail-grid">
              <div className="fail-col fail-col-bad">
                <h3>❌ Without CentuMania</h3>
                {['Scattered preparation — studying randomly, no structure','No daily accountability or consistent practice','No benchmark — don\'t know where you stand vs. peers','Generic content not tailored to the exam pattern','Motivation collapses after the first week'].map(t=>(
                  <div key={t} className="fail-item"><span className="fail-x">✗</span><p className="fail-text">{t}</p></div>
                ))}
              </div>
              <div className="fail-col fail-col-good">
                <h3>✓ With CentuMania</h3>
                {['Day-by-day structured plan covering every topic','Daily timed exam at 6 AM builds iron discipline','Live leaderboard — see your rank update in real time','Questions modelled on actual LDC/UDC exam pattern','Daily momentum system keeps you going until exam day'].map(t=>(
                  <div key={t} className="fail-item"><span className="check-x">✓</span><p className="fail-text">{t}</p></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DAILY TEST */}
      <section className="section section-alt">
        <div className="container">
          <span className="label label-indigo" style={{textAlign:'center',display:'block'}}>Daily discipline</span>
          <h2 className="heading-lg section-heading">The daily test system</h2>
          <p className="section-sub">A 30-minute timed exam every morning. Miss it, lose your rank. Attempt it, build the habit.</p>
          <div className="test-layout" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:40,alignItems:'center',maxWidth:880,margin:'0 auto'}}>
            <div className="test-card-hero">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <span className="badge" style={{background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.20)'}}>⚡ Live · Day 14</span>
                <span className="badge badge-gold">🔥 7 streak</span>
              </div>
              <div style={{fontSize:12,color:'rgba(255,255,255,.60)',marginBottom:4}}>Window closes in</div>
              <div className="test-timer">01:24:37</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,.55)',marginBottom:4}}>6:00 – 8:30 AM IST · auto-submits</div>
              <div style={{height:4,background:'rgba(255,255,255,.10)',borderRadius:999,margin:'16px 0'}}><div style={{height:'100%',background:'var(--gold)',borderRadius:999,width:'62%'}} /></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'rgba(255,255,255,.60)',marginBottom:4}}><span>Q62 answered</span><span>Accuracy 78%</span></div>
              <Link href="/auth/login" className="btn btn-gold" style={{width:'100%',justifyContent:'center',marginTop:16}}>Start Today&apos;s Test →</Link>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[{i:'⏱️',h:'30-Minute Timed Window',p:'Opens at 6 AM, closes at 8:30 AM. Auto-submits when time runs out. No exceptions — builds exam-day discipline.'},{i:'🎯',h:'Instant Answer Key',p:'Detailed explanations for every question after submission. Understand your mistakes while they\'re fresh.'},{i:'📊',h:'Performance Tracking',p:'Every score is logged. See your accuracy trend, rank trajectory, and subject-wise improvement over time.'}].map(f=>(
                <div key={f.h} className="test-feat"><div className="test-feat-icon">{f.i}</div><div><h4>{f.h}</h4><p>{f.p}</p></div></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LEADERBOARD */}
      <section className="section">
        <div className="container">
          <span className="label label-gold" style={{textAlign:'center',display:'block'}}>Accountability engine</span>
          <h2 className="heading-lg section-heading">Leaderboard &amp; accountability</h2>
          <p className="section-sub">Real-time rankings updated after every exam. Your rank is public — so is your discipline.</p>
          <div className="lb-layout" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:40,alignItems:'start',maxWidth:880,margin:'0 auto'}}>
            <div className="leaderboard-preview">
              <div className="lb-header"><span className="lb-title">Live Leaderboard</span><span className="badge badge-success"><span style={{width:6,height:6,borderRadius:'50%',background:'var(--success)',animation:'pulse 2s infinite',display:'inline-block'}} />Live</span></div>
              {[{rank:'1',cls:'gold-rank',name:'Meena P.',sub:'30-day streak',score:'2,840',streak:'🏆 30d'},{rank:'2',cls:'silver-rank',name:'Ravi V.',sub:'28-day streak',score:'2,710',streak:'🔥 28d'},{rank:'3',cls:'bronze-rank',name:'Arun K.',sub:'25-day streak',score:'2,590',streak:'🔥 25d'}].map(r=>(
                <div key={r.rank} className="lb-row"><div className={`lb-rank ${r.cls}`}>{r.rank}</div><div><div className="lb-name">{r.name}</div><div style={{fontSize:11,color:'var(--n500)'}}>{r.sub}</div></div><div className="lb-score">{r.score}</div><div className="lb-streak">{r.streak}</div></div>
              ))}
              <div className="lb-row lb-you"><div className="lb-rank" style={{color:'var(--indigo)'}}>12</div><div><div className="lb-name" style={{color:'var(--indigo)'}}>You → Prasanna</div><div style={{fontSize:11,color:'var(--n500)'}}>14-day streak</div></div><div className="lb-score">1,980</div><div className="lb-streak">🔥 14d</div></div>
              <div className="lb-row"><div className="lb-rank">13</div><div><div className="lb-name">Kavya S.</div><div style={{fontSize:11,color:'var(--n500)'}}>12-day streak</div></div><div className="lb-score">1,940</div><div className="lb-streak">🔥 12d</div></div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:16,paddingTop:8}}>
              <div className="card card-indigo"><h4 style={{fontSize:15,fontWeight:700,marginBottom:6}}>Public accountability</h4><p style={{fontSize:14,color:'var(--n300)',lineHeight:1.6}}>Your rank is visible to every aspirant in the batch. The social pressure is the point — it keeps you showing up even when motivation runs low.</p></div>
              <div className="card card-gold"><h4 style={{fontSize:15,fontWeight:700,marginBottom:6}}>🏆 Centum Index</h4><p style={{fontSize:14,color:'var(--n300)',lineHeight:1.6}}>Achieve a perfect 100 on any exam and earn the Centum badge — a permanent mark of excellence on your leaderboard profile.</p></div>
              <div className="card card-teal"><h4 style={{fontSize:15,fontWeight:700,marginBottom:6}}>🔥 Streak Rewards</h4><p style={{fontSize:14,color:'var(--n300)',lineHeight:1.6}}>Maintain a 7-day streak to unlock streak badges. Full programme completion earns the Mastery badge — shown permanently on your profile.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ANALYTICS */}
      <section className="section section-alt">
        <div className="container">
          <span className="label label-teal" style={{textAlign:'center',display:'block'}}>Track everything</span>
          <h2 className="heading-lg section-heading">Performance analytics</h2>
          <p className="section-sub">Your dashboard shows every metric you need to know what to fix and when.</p>
          <div className="analytics-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,maxWidth:880,margin:'0 auto'}}>
            <div className="analytics-card">
              <h4>Overall Score</h4>
              <div className="big-stat" style={{color:'var(--success)'}}>78<span style={{fontSize:24,color:'var(--n500)'}}>/100</span></div>
              <div style={{fontSize:12,color:'var(--n500)',marginTop:4}}>Day 14 average</div>
              <div className="progress-bar" style={{marginTop:14}}><div className="progress-fill" style={{width:'78%'}} /></div>
            </div>
            <div className="analytics-card">
              <h4>Subject Accuracy</h4>
              {[['Tamil','85%','var(--indigo)',85],['English','72%','var(--indigo)',72],['Aptitude','64%','var(--warning)',64],['GK','90%','var(--success)',90],['Reasoning','70%','var(--indigo)',70]].map(([l,v,c,w])=>(
                <div key={l as string} className="mini-bar-row"><span className="mini-bar-label">{l}</span><div className="mini-bar"><div className="mini-bar-fill" style={{width:`${w}%`,background:c as string}} /></div><span className="mini-bar-val">{v}</span></div>
              ))}
            </div>
            <div className="analytics-card">
              <h4>Rank Trajectory</h4>
              <div className="big-stat" style={{color:'var(--indigo)'}}>#12</div>
              <div style={{fontSize:12,color:'var(--success)',marginTop:4}}>↑ Up from #47 on Day 1</div>
              <div style={{marginTop:16,display:'flex',flexDirection:'column',gap:6}}>
                {[['Streak','🔥 14 days','var(--gold)'],['Top %','Top 12%','var(--n100)'],['Total pts','1,980','var(--n100)']].map(([l,v,c])=>(
                  <div key={l as string} style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:'var(--n500)'}}>{l}</span><span style={{color:c as string,fontWeight:700}}>{v}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REFUND */}
      <section className="section">
        <div className="container">
          <span className="label label-gold" style={{textAlign:'center',display:'block'}}>Zero risk</span>
          <h2 className="heading-lg section-heading">Refund eligibility system</h2>
          <p className="section-sub">We believe in the programme enough to offer a performance-linked refund. Give it everything — if it doesn&apos;t work, get your money back.</p>
          <div className="refund-card">
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}><span className="badge badge-gold">🛡️ Money Back Guarantee</span></div>
            <h3>Qualify for a full refund if you:</h3>
            <div className="refund-conditions">
              {[{i:'📅',t:'Attempted all daily exams without missing a single day'},{i:'📊',t:'Maintained an average score below 50% across all exams'},{i:'⏰',t:'Submitted the refund request within 7 days of programme completion'},{i:'✅',t:'Completed all exam sessions for each programme day'}].map(r=>(
                <div key={r.t} className="refund-item"><span>{r.i}</span><p>{r.t}</p></div>
              ))}
            </div>
            <p className="refund-disclaimer">Refund is processed within 7 business days to the original payment method. Refund eligibility is verified automatically from your exam submission data. This guarantee is available for first-time enrolments only.</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section section-alt">
        <div className="container">
          <span className="label" style={{textAlign:'center',display:'block'}}>Real results</span>
          <h2 className="heading-lg section-heading">Student transformation stories</h2>
          <p className="section-sub">Aspirants who trusted the process — and what consistent daily discipline actually looks like.</p>
          <div className="grid-3" style={{maxWidth:880,margin:'0 auto'}}>
            {[
              {stars:'★★★★★',text:'"I used to study for hours without knowing if it was actually helping. The daily exam gave me an honest score every morning. By week 3, I could see real improvement in my accuracy across subjects."',ini:'AK',name:'Arun K.',role:'LDC Aspirant'},
              {stars:'★★★★★',text:'"The 6 AM routine was hard to keep up the first week. By week 2 it became automatic. Knowing my rank updated daily pushed me to show up even on days I felt completely unprepared."',ini:'MP',name:'Meena P.',role:'Government Exam Aspirant'},
              {stars:'★★★★★',text:'"Finally a system where I could see exactly which subjects needed work. My aptitude accuracy improved noticeably over the programme because I had a clear picture of where I was losing marks."',ini:'RV',name:'Ravi V.',role:'Competitive Exam Aspirant'}
            ].map(t=>(
              <div key={t.name} className="testi-card">
                <div className="testi-stars">{t.stars}</div>
                <p className="testi-text">{t.text}</p>
                <div className="testi-author"><div className="testi-avatar">{t.ini}</div><div><div className="testi-name">{t.name}</div><div className="testi-role">{t.role}</div></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="pricing">
        <div className="container">
          <span className="label label-indigo" style={{textAlign:'center',display:'block'}}>Simple pricing</span>
          <h2 className="heading-lg section-heading">One plan. Everything included.</h2>
          <p className="section-sub">No tiers, no upsells. One payment unlocks full programme access.</p>
          <div className="pricing-card">
            <span className="badge badge-gold" style={{marginBottom:20}}>🏆 UDC Mastery Programme</span>
            <div className="price-amount"><sup>₹</sup>999</div>
            <div className="price-period">one-time · full programme access</div>
            <ul className="price-features">
              {['Daily timed exams — full-length, timed','Live leaderboard & rank tracking','AI Mentor coaching reports','Performance analytics dashboard','Centum & streak achievement badges','Performance-linked refund guarantee'].map(f=><li key={f}>{f}</li>)}
            </ul>
            <Link href="/auth/register" className="btn btn-gold" style={{width:'100%',justifyContent:'center',fontSize:17,padding:'16px 28px',borderRadius:12}}>Start My Journey →</Link>
            <p className="price-note">Secure payment · Instant access · Refund eligible</p>
            <p style={{marginTop:12,fontSize:12,color:'var(--n500)',textAlign:'center'}}>
              Have a question?{' '}
              <a href="https://wa.me/917200132957" target="_blank" rel="noopener noreferrer" style={{color:'#22C55E',fontWeight:700}}>
                WhatsApp us →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-alt" id="faq">
        <div className="container">
          <span className="label" style={{textAlign:'center',display:'block'}}>Got questions?</span>
          <h2 className="heading-lg section-heading">Frequently asked questions</h2>
          <p className="section-sub" style={{marginBottom:40}}>Everything you need to know before joining.</p>
          <div className="faq-list">
            {FAQS.map((item,i)=>(
              <div key={i} className="faq-item">
                <button className={`faq-q${openFaq===i?' open':''}`} onClick={()=>setOpenFaq(openFaq===i?null:i)}>
                  <span>{item.q}</span><span className="chevron">▼</span>
                </button>
                {openFaq===i && <div className="faq-a">{item.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta-section">
        <div className="cta-card">
          <span className="badge badge-indigo" style={{marginBottom:18}}>🚀 Your Exam Journey Starts Here</span>
          <h2 className="heading-lg">Your transformation starts today.</h2>
          <p>Join the most disciplined aspirants. One batch. One shot. Make it count.</p>
          <div className="cta-btns">
            <Link href="/auth/register" className="btn btn-gold btn-lg">Start the Programme →</Link>
          </div>
          <div style={{marginTop:24,fontSize:13,color:'var(--n500)'}}>🛡️ Performance-linked refund guarantee · ⚡ Instant access after payment</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="nav-logo"><em>Centu</em>Mania</div>
            <p>The most disciplined LDC/UDC exam prep platform. Winning is a habit.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Programme</h4>
              <a href="#pricing" onClick={e=>{e.preventDefault();goto('pricing')}}>Pricing</a>
              <a href="#faq" onClick={e=>{e.preventDefault();goto('faq')}}>FAQ</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <Link href="/about">About Us</Link>
              <Link href="/contact">Contact Us</Link>
            </div>
            <div className="footer-col">
              <h4>Platform</h4>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/exam/today">Daily Exam</Link>
              <Link href="/leaderboard">Leaderboard</Link>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms &amp; Conditions</Link>
              <Link href="/refund">Refund Policy</Link>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <a href="https://wa.me/917200132957" target="_blank" rel="noopener noreferrer">WhatsApp Support</a>
              <a href="https://wa.me/917200132957" target="_blank" rel="noopener noreferrer" style={{color:'var(--n700)'}}>+91 72001 32957</a>
            </div>
          </div>
        </div>
        <div className="footer-copy">© 2026 CentuMania. Winning is a habit.</div>
      </footer>
    </div>
  )
}
