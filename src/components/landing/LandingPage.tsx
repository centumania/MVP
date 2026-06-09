'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ── Design tokens ─────────────────────────────────────────────────
const C = {
  green:       '#4ADE80',
  greenDark:   '#22C55E',
  greenDeep:   '#16A34A',
  bg:          '#070C07',
  surface:     '#0C160C',
  surface2:    '#121F12',
  text:        '#F0FDF4',
  muted:       '#7A9E82',
  gold:        '#FBBF24',
  goldBg:      'rgba(251,191,36,0.10)',
  goldBorder:  'rgba(251,191,36,0.28)',
  border:      'rgba(74,222,128,0.18)',
  borderFaint: 'rgba(255,255,255,0.07)',
}
const D: React.CSSProperties = { fontFamily: "var(--font-fraunces, 'Georgia', serif)" }
const SANS: React.CSSProperties = { fontFamily: "var(--font-hanken, 'Helvetica Neue', sans-serif)" }

// ── Logo: "Centu" white · "Mania" green ───────────────────────────
function Logo({ size = 36 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.33 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `${Math.max(1.5, size * 0.045)}px solid rgba(74,222,128,0.22)` }} />
        <div style={{ position: 'absolute', inset: '18%', borderRadius: '50%', border: `${Math.max(1.5, size * 0.045)}px solid rgba(74,222,128,0.50)` }} />
        <div style={{ position: 'absolute', inset: '36%', borderRadius: '50%', backgroundColor: C.green, boxShadow: `0 0 ${size * 0.4}px rgba(74,222,128,0.55)` }} />
      </div>
      <span style={{ ...D, fontWeight: 900, fontSize: size * 0.52, letterSpacing: '-0.025em', lineHeight: 1 }}>
        <span style={{ color: C.text }}>Centu</span><span style={{ color: C.green }}>Mania</span>
      </span>
    </div>
  )
}

// ── Landing Page ──────────────────────────────────────────────────
export default function LandingPage() {
  const [faq, setFaq] = useState<number | null>(null)
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    const calc = () => {
      // LDC exam: June 28 2026 midnight IST
      const exam = new Date('2026-06-28T00:00:00+05:30')
      const now = new Date()
      const days = Math.ceil((exam.getTime() - now.getTime()) / 86_400_000)
      setDaysLeft(Math.max(0, days))
    }
    calc()
    const t = setInterval(calc, 60_000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ backgroundColor: C.bg, color: C.text, ...SANS, overflowX: 'hidden' }}>
      <style>{`
        @keyframes fadeUp    { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:translateY(0) } }
        @keyframes scaleIn   { from { opacity:0; transform:scale(0.86) } to { opacity:1; transform:scale(1) } }
        @keyframes glowPulse { 0%,100%{ opacity:.3;transform:scale(1) } 50%{ opacity:.55;transform:scale(1.06) } }
        @keyframes float     { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-7px) } }
        .anim-logo  { animation: scaleIn  .75s .00s cubic-bezier(.16,1,.3,1) both }
        .anim-label { animation: fadeUp   .60s .30s cubic-bezier(.16,1,.3,1) both }
        .anim-h1    { animation: fadeUp   .70s .48s cubic-bezier(.16,1,.3,1) both }
        .anim-sub   { animation: fadeUp   .60s .66s cubic-bezier(.16,1,.3,1) both }
        .anim-cta   { animation: fadeUp   .60s .82s cubic-bezier(.16,1,.3,1) both }
        .anim-glow  { animation: glowPulse 4.5s ease-in-out infinite }
        .anim-float { animation: float    4.0s ease-in-out infinite }
        .btn-p  { transition: filter .18s, transform .18s }
        .btn-p:hover  { filter:brightness(1.09); transform:translateY(-2px) }
        .btn-o  { transition: background .18s }
        .btn-o:hover  { background:rgba(74,222,128,0.10) }
        .lift   { transition: border-color .22s, transform .22s, box-shadow .22s }
        .lift:hover { border-color:rgba(74,222,128,.40)!important; transform:translateY(-3px); box-shadow:0 16px 40px rgba(0,0,0,.35) }
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────────── */}
      <nav style={{ position:'sticky', top:0, zIndex:50, backgroundColor:'rgba(7,12,7,0.94)', backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Logo size={30} />
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <Link href="/auth/login" style={{ color:C.muted, fontSize:14, padding:'8px 16px', textDecoration:'none' }}>Sign In</Link>
            <Link href="/auth/register" className="btn-p" style={{ backgroundColor:C.green, color:'#040C04', fontWeight:700, fontSize:14, padding:'9px 22px', borderRadius:8, textDecoration:'none' }}>
              Join Now
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ position:'relative', minHeight:'90vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 24px', textAlign:'center', overflow:'hidden' }}>
        <div className="anim-glow" style={{ position:'absolute', top:'40%', left:'50%', transform:'translate(-50%,-50%)', width:800, height:500, background:'radial-gradient(ellipse, rgba(74,222,128,0.13) 0%, transparent 68%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(rgba(74,222,128,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.025) 1px,transparent 1px)`, backgroundSize:'52px 52px', pointerEvents:'none' }} />
        <div style={{ maxWidth:760, margin:'0 auto', position:'relative', zIndex:1 }}>
          <div className="anim-logo anim-float" style={{ display:'flex', justifyContent:'center', marginBottom:44 }}>
            <Logo size={80} />
          </div>
          <p className="anim-label" style={{ fontSize:13, letterSpacing:'0.16em', color:C.green, textTransform:'uppercase', marginBottom:20, fontWeight:600 }}>
            Welcome to CentuMania
          </p>
          <h1 className="anim-h1" style={{ ...D, fontWeight:900, fontSize:'clamp(60px,12vw,100px)', lineHeight:0.87, letterSpacing:'-0.04em', marginBottom:28 }}>
            Winning is<br /><span style={{ color:C.green }}>a Habit.</span>
          </h1>
          <p className="anim-sub" style={{ fontSize:18, color:C.muted, lineHeight:1.65, maxWidth:500, margin:'0 auto 52px' }}>
            India's most disciplined exam prep system. Daily tests. AI Mentor Reports. Live rankings. Ruthless accountability.
          </p>
          <div className="anim-cta" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginBottom:20 }}>
            <Link href="/auth/register" className="btn-p" style={{ backgroundColor:C.green, color:'#040C04', fontWeight:700, fontSize:18, padding:'17px 44px', borderRadius:12, textDecoration:'none', letterSpacing:'-0.01em' }}>
              Claim My Seat →
            </Link>
            <a href="#programmes" className="btn-o" style={{ color:C.text, fontWeight:600, fontSize:16, padding:'17px 32px', borderRadius:12, textDecoration:'none', border:`1px solid ${C.border}` }}>
              View Programmes
            </a>
          </div>
          <p style={{ color:C.muted, fontSize:13 }}>UDC & LDC · 15-day intensive · June 28 exam</p>
        </div>
      </section>

      {/* ── DAILY TEST BAR ───────────────────────────────────────── */}
      <div style={{ backgroundColor:C.surface, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:'18px 24px' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'flex', justifyContent:'center', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          <span style={{ width:8, height:8, borderRadius:'50%', backgroundColor:C.green, display:'inline-block', boxShadow:`0 0 8px ${C.green}` }} />
          <span style={{ color:C.green, fontWeight:700, fontSize:13, letterSpacing:'0.08em', textTransform:'uppercase' }}>Daily Test</span>
          <span style={{ color:C.muted, fontSize:13 }}>|</span>
          <span style={{ ...D, fontWeight:900, fontSize:24, color:C.text, letterSpacing:'-0.025em' }}>6:00 AM – 8:00 AM</span>
          <span style={{ color:C.muted, fontSize:13 }}>|</span>
          <span style={{ color:C.muted, fontSize:13 }}>30-min test · Auto-submits at 8:00 AM · Server-enforced IST</span>
        </div>
      </div>

      {/* ── PROGRAMME HIERARCHY ──────────────────────────────────── */}
      <section id="programmes" style={{ padding:'104px 24px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <p style={{ color:C.green, fontSize:12, letterSpacing:'0.10em', textTransform:'uppercase', marginBottom:14 }}>Programmes</p>
          <h2 style={{ ...D, fontWeight:900, fontSize:'clamp(36px,6vw,56px)', letterSpacing:'-0.03em', lineHeight:1.02 }}>
            Choose Your Path to Victory
          </h2>
        </div>
        <div style={{ display:'flex', gap:20, flexWrap:'wrap', alignItems:'stretch' }}>

          {/* UDC — FLAGSHIP */}
          <div className="lift" style={{ flex:'1 1 330px', backgroundColor:C.surface, border:`2px solid ${C.green}`, borderRadius:24, padding:'48px 36px', position:'relative' }}>
            <div style={{ position:'absolute', top:-14, left:28, backgroundColor:C.green, color:'#040C04', fontSize:11, fontWeight:800, padding:'5px 16px', borderRadius:100, letterSpacing:'0.06em' }}>
              FLAGSHIP PROGRAMME
            </div>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:24 }}>
              <div>
                <div style={{ color:C.muted, fontSize:12, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>Upper Division Clerk</div>
                <h3 style={{ ...D, fontWeight:900, fontSize:52, letterSpacing:'-0.04em', lineHeight:1, color:C.text }}>UDC</h3>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:10, flexWrap:'wrap' }}>
                  <span style={{ ...D, fontSize:20, fontWeight:700, color:C.muted, textDecoration:'line-through', letterSpacing:'-0.02em' }}>₹1,499</span>
                  <span style={{ ...D, fontSize:38, fontWeight:900, color:C.green, letterSpacing:'-0.035em', lineHeight:1 }}>₹999</span>
                  <span style={{ backgroundColor:'#EF4444', color:'#fff', fontSize:12, fontWeight:800, padding:'3px 10px', borderRadius:100, letterSpacing:'0.04em' }}>33% OFF</span>
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, backgroundColor:'rgba(251,191,36,0.10)', border:'1px solid rgba(251,191,36,0.30)', borderRadius:8, padding:'5px 12px', marginTop:10 }}>
                  <span style={{ color:C.gold, fontSize:12 }}>⏰</span>
                  <span style={{ color:C.gold, fontSize:12, fontWeight:700 }}>Exclusive price — valid for 2 days only</span>
                </div>
              </div>
              <div style={{ marginLeft:'auto', backgroundColor:C.goldBg, border:`1px solid ${C.goldBorder}`, borderRadius:8, padding:'5px 12px', flexShrink:0 }}>
                <span style={{ color:C.gold, fontSize:12, fontWeight:700 }}>★ Premium</span>
              </div>
            </div>
            <p style={{ color:C.muted, fontSize:15, lineHeight:1.65, marginBottom:28 }}>
              The flagship programme for Upper Division Clerk aspirants. Full syllabus coverage, daily tests, AI mentor reports, and live leaderboard competition. Batch details coming soon.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:11, marginBottom:12 }}>
              {[
                'Daily tests: 6:00 AM – 8:00 AM',
                '30-min test · Auto-submits at 8:00 AM',
                'Live leaderboard & Centum Index',
                'AI mentor report after each test',
              ].map(f => (
                <div key={f} style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <span style={{ color:C.green, fontSize:16 }}>✓</span>
                  <span style={{ color:'#C8E6D0', fontSize:14 }}>{f}</span>
                </div>
              ))}
            </div>

            {/* LDC FREE callout */}
            <div style={{ backgroundColor:'rgba(74,222,128,0.08)', border:`2px solid rgba(74,222,128,0.40)`, borderRadius:12, padding:'18px 20px', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                <p style={{ color:C.green, fontWeight:800, fontSize:15, margin:0 }}>
                  🎁 LDC worth
                </p>
                <span style={{ ...D, fontSize:20, fontWeight:900, color:C.muted, textDecoration:'line-through', letterSpacing:'-0.02em' }}>₹499</span>
                <span style={{ backgroundColor:C.green, color:'#040C04', fontWeight:800, fontSize:13, padding:'2px 10px', borderRadius:100 }}>FREE</span>
              </div>
              <p style={{ color:'#A7F3C0', fontSize:13, lineHeight:1.55, margin:0 }}>
                Join UDC today and get complete LDC content — every test, every material — at no extra cost. Two programmes. One price.
              </p>
            </div>

            <div style={{ backgroundColor:'rgba(74,222,128,0.05)', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', marginBottom:20, textAlign:'center' }}>
              <span style={{ color:C.gold, fontSize:12, fontWeight:700 }}>⏰ Free LDC access valid only if you join within 2 days</span>
            </div>

            <Link href="/auth/register" className="btn-p" style={{ display:'block', textAlign:'center', backgroundColor:C.green, color:'#040C04', fontWeight:700, fontSize:16, padding:'15px 0', borderRadius:10, textDecoration:'none' }}>
              Register Interest in UDC →
            </Link>
          </div>

          {/* LDC — SECONDARY */}
          <div className="lift" style={{ flex:'1 1 270px', backgroundColor:C.surface, border:`1px solid ${C.borderFaint}`, borderRadius:24, padding:'48px 32px', position:'relative' }}>
            <div style={{ color:C.muted, fontSize:12, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>Lower Division Clerk</div>
            <h3 style={{ ...D, fontWeight:900, fontSize:48, letterSpacing:'-0.04em', lineHeight:1, color:C.text, marginBottom:10 }}>LDC</h3>
            <div style={{ ...D, fontSize:38, fontWeight:900, color:C.green, letterSpacing:'-0.035em', lineHeight:1, marginBottom:20 }}>₹499</div>
            <p style={{ color:C.muted, fontSize:15, lineHeight:1.65, marginBottom:24 }}>
              A focused 15-day foundation programme for LDC aspirants. Build the daily execution habit, compete on the leaderboard, and track your Centum Index.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:32 }}>
              {[
                '15-day foundation programme',
                'Daily tests: 6:00 AM – 8:00 AM',
                '30-min test · Auto-submits at 8:00 AM',
                'Live leaderboard & Centum Index',
                '50% cashback for perfect attendance',
              ].map(f => (
                <div key={f} style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <span style={{ color:C.greenDeep, fontSize:15 }}>✓</span>
                  <span style={{ color:C.muted, fontSize:14 }}>{f}</span>
                </div>
              ))}
            </div>
            <Link href="/auth/register" className="btn-o" style={{ display:'block', textAlign:'center', color:C.text, fontWeight:600, fontSize:15, padding:'14px 0', borderRadius:10, textDecoration:'none', border:`1px solid ${C.border}` }}>
              Enrol in LDC
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────── */}
      <div style={{ borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:'36px 24px', backgroundColor:C.surface }}>
        <div style={{ maxWidth:800, margin:'0 auto', display:'flex', justifyContent:'space-around', flexWrap:'wrap', gap:28 }}>
          {[
            {n:'15',   l:'Days of Discipline'},
            {n:'6 AM', l:'Test Window Opens'},
            {n:'30',   l:'Minutes Per Test'},
            {n:'50%',  l:'Cashback If You Earn It'},
          ].map(s => (
            <div key={s.n} style={{ textAlign:'center' }}>
              <div style={{ ...D, fontSize:44, fontWeight:900, color:C.green, letterSpacing:'-0.04em', lineHeight:1 }}>{s.n}</div>
              <div style={{ color:C.muted, fontSize:13, marginTop:6 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI MENTOR REPORT ─────────────────────────────────────── */}
      <section style={{ padding:'100px 24px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:56, alignItems:'center' }}>
          <div style={{ flex:'1 1 320px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, backgroundColor:'rgba(74,222,128,0.08)', border:`1px solid ${C.border}`, borderRadius:100, padding:'5px 16px', marginBottom:24 }}>
              <span style={{ fontSize:14 }}>✦</span>
              <span style={{ color:C.green, fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>Powered by AI</span>
            </div>
            <h2 style={{ ...D, fontWeight:900, fontSize:'clamp(36px,6vw,56px)', letterSpacing:'-0.03em', lineHeight:1.0, marginBottom:20 }}>
              AI Mentor<br /><span style={{ color:C.green }}>Report.</span>
            </h2>
            <p style={{ color:C.muted, fontSize:16, lineHeight:1.72, marginBottom:28 }}>
              After every daily test, CentuMania generates your personal AI coaching analysis. Not a generic result — a targeted breakdown of exactly where you stand and what to fix next.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { icon:'📊', t:'Strengths & Weak Topics',    d:'Pinpoints the exact subjects pulling your score down.' },
                { icon:'🎯', t:'Predicted Score Range',      d:'Estimates your likely marks on exam day based on trends.' },
                { icon:'🧠', t:'Learning Profile',           d:'Scholar, Sprinter, Late Bloomer — know how you study.' },
                { icon:'📋', t:"Today's Study Mission",      d:'Focused tasks with time estimates to fix your weak spots.' },
                { icon:'📈', t:'Exam Readiness Score',       d:'A live 0–100 index showing your actual preparation level.' },
              ].map(item => (
                <div key={item.t} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                  <span style={{ fontSize:18, lineHeight:1.4, flexShrink:0 }}>{item.icon}</span>
                  <div>
                    <span style={{ color:C.text, fontWeight:600, fontSize:15 }}>{item.t} — </span>
                    <span style={{ color:C.muted, fontSize:15 }}>{item.d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mock report card */}
          <div style={{ flex:'1 1 300px', backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:20, overflow:'hidden' }}>
            <div style={{ padding:'16px 22px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', backgroundColor:C.green, display:'inline-block', boxShadow:`0 0 6px ${C.green}` }} />
              <span style={{ color:C.green, fontWeight:700, fontSize:13, letterSpacing:'0.05em' }}>AI MENTOR REPORT · Day 8</span>
            </div>
            <div style={{ padding:'24px 22px', display:'flex', flexDirection:'column', gap:18 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[
                  { l:'Readiness Score', v:'74%', hi:true },
                  { l:'Predicted Range', v:'68–76', hi:false },
                  { l:'Learning Profile', v:'Consistent Performer', hi:false },
                  { l:'Days Attended',   v:'8 / 8', hi:true },
                ].map(stat => (
                  <div key={stat.l} style={{ backgroundColor:C.surface2, borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ color:C.muted, fontSize:11, letterSpacing:'0.04em', textTransform:'uppercase', marginBottom:4 }}>{stat.l}</div>
                    <div style={{ ...D, fontSize:stat.l === 'Learning Profile' ? 13 : 20, fontWeight:900, color:stat.hi ? C.green : C.text, letterSpacing:'-0.02em', lineHeight:1.2 }}>{stat.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop:`1px solid ${C.borderFaint}`, paddingTop:16 }}>
                <div style={{ color:C.muted, fontSize:12, letterSpacing:'0.04em', textTransform:'uppercase', marginBottom:10 }}>Weak Topics</div>
                {[
                  { topic:'Current Affairs', pct:38 },
                  { topic:'Arithmetic',      pct:44 },
                  { topic:'Reasoning',       pct:51 },
                ].map(item => (
                  <div key={item.topic} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ color:C.text, fontSize:13 }}>{item.topic}</span>
                      <span style={{ color:C.muted, fontSize:13 }}>{item.pct}%</span>
                    </div>
                    <div style={{ height:4, backgroundColor:C.surface2, borderRadius:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${item.pct}%`, backgroundColor: item.pct < 45 ? '#EF4444' : '#F59E0B', borderRadius:4 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ backgroundColor:'rgba(74,222,128,0.05)', border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 14px' }}>
                <div style={{ color:C.green, fontSize:12, fontWeight:700, marginBottom:6 }}>📋 Today's Mission</div>
                <p style={{ color:C.muted, fontSize:13, lineHeight:1.6, margin:0 }}>Spend 45 min on Current Affairs (Polity focus). Attempt 20 Arithmetic problems. Review your Reasoning errors from Day 6.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SCARCITY ─────────────────────────────────────────────── */}
      <section style={{ padding:'88px 24px', backgroundColor:C.surface, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:720, margin:'0 auto', textAlign:'center' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, border:`1px solid ${C.goldBorder}`, borderRadius:100, padding:'5px 20px', marginBottom:28, backgroundColor:C.goldBg }}>
            <span style={{ color:C.gold, fontSize:11 }}>●</span>
            <span style={{ color:C.gold, fontSize:12, fontWeight:600, letterSpacing:'0.06em' }}>LIMITED AVAILABILITY</span>
          </div>
          <h2 style={{ ...D, fontWeight:900, fontSize:'clamp(40px,8vw,72px)', letterSpacing:'-0.04em', lineHeight:0.92, marginBottom:18 }}>
            SEATS DON'T WAIT<br />FOR READINESS.
          </h2>
          <p style={{ ...D, fontSize:'clamp(20px,4vw,28px)', fontWeight:700, color:C.green, letterSpacing:'-0.02em', marginBottom:24 }}>
            Act now or watch someone else take your seat.
          </p>
          <p style={{ color:C.muted, fontSize:17, lineHeight:1.68, maxWidth:520, margin:'0 auto 36px' }}>
            This is a structured cohort — not a subscription you sign up for and forget. One batch, one shot. When it fills, enrollment closes permanently.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginBottom:28 }}>
            {[
              {label:'June 28', sub:'LDC Exam Date'},
              {label:'15',      sub:'Days of Preparation'},
              {label:'6 AM',    sub:'Test Opens Daily'},
            ].map(item => (
              <div key={item.label} style={{ backgroundColor:C.surface2, border:`1px solid ${C.borderFaint}`, borderRadius:14, padding:'18px 28px', textAlign:'center', minWidth:110 }}>
                <div style={{ ...D, fontSize:30, fontWeight:900, color:C.text, letterSpacing:'-0.03em', lineHeight:1 }}>{item.label}</div>
                <div style={{ color:C.muted, fontSize:12, marginTop:6 }}>{item.sub}</div>
              </div>
            ))}
          </div>
          <Link href="/auth/register" className="btn-p" style={{ display:'inline-block', backgroundColor:C.green, color:'#040C04', fontWeight:700, fontSize:17, padding:'15px 40px', borderRadius:10, textDecoration:'none' }}>
            Secure My Seat Now →
          </Link>
          <p style={{ color:C.green, fontSize:14, fontWeight:600, marginTop:16 }}>
            Special offer available if you join today
          </p>
        </div>
      </section>

      {/* ── OFFER CARD ───────────────────────────────────────────── */}
      <section style={{ padding:'80px 24px', maxWidth:760, margin:'0 auto' }}>
        <div className="lift" style={{ backgroundColor:C.surface, border:`2px solid ${C.green}`, borderRadius:24, padding:'52px 40px', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:500, height:250, background:'radial-gradient(ellipse, rgba(74,222,128,0.07) 0%, transparent 70%)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', justifyContent:'center', gap:10, flexWrap:'wrap', marginBottom:28 }}>
              <div style={{ backgroundColor:C.goldBg, border:`1px solid ${C.goldBorder}`, borderRadius:100, padding:'5px 18px', fontSize:12, color:C.gold, fontWeight:700, letterSpacing:'0.05em' }}>
                🎁 EXCLUSIVE OFFER
              </div>
              <div style={{ backgroundColor:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.30)', borderRadius:100, padding:'5px 18px', fontSize:12, color:'#FCA5A5', fontWeight:700, letterSpacing:'0.05em' }}>
                ⏰ OFFER VALID FOR 2 DAYS ONLY
              </div>
            </div>
            <h3 style={{ ...D, fontWeight:900, fontSize:'clamp(32px,6vw,52px)', letterSpacing:'-0.035em', lineHeight:1.02, marginBottom:14 }}>
              Join Within The Next<br /><span style={{ color:C.green }}>2 Days.</span>
            </h3>
            <p style={{ ...D, fontSize:'clamp(20px,4vw,28px)', fontWeight:700, color:C.text, marginBottom:28 }}>
              Get Complimentary Access
            </p>
            <div style={{ backgroundColor:'rgba(74,222,128,0.05)', border:`1px solid ${C.border}`, borderRadius:16, padding:'24px 36px', display:'inline-block', marginBottom:28 }}>
              <p style={{ color:C.muted, fontSize:13, marginBottom:8, letterSpacing:'0.04em', textTransform:'uppercase' }}>UDC Students Receive</p>
              <p style={{ ...D, fontWeight:900, fontSize:'clamp(26px,5vw,36px)', color:C.green, letterSpacing:'-0.03em', lineHeight:1.1 }}>
                Complimentary<br />LDC Access
              </p>
            </div>
            <p style={{ color:C.muted, fontSize:16, lineHeight:1.65, maxWidth:480, margin:'0 auto 36px' }}>
              Enrol in UDC within 2 days and receive complimentary access to the LDC programme — at no extra cost.
            </p>
            <Link href="/auth/register" className="btn-p" style={{ display:'inline-block', backgroundColor:C.green, color:'#040C04', fontWeight:700, fontSize:18, padding:'17px 52px', borderRadius:12, textDecoration:'none', letterSpacing:'-0.01em' }}>
              Claim This Offer →
            </Link>
            <p style={{ color:C.muted, fontSize:13, marginTop:14 }}>Offer expires in 2 days · Limited seats</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section style={{ padding:'40px 24px 80px', maxWidth:700, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <h2 style={{ ...D, fontWeight:900, fontSize:'clamp(36px,6vw,52px)', letterSpacing:'-0.03em' }}>Questions.</h2>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {[
            {
              q: 'What if I miss a test?',
              a: 'The 6:00–8:00 AM window is strict and server-enforced. The test auto-submits at 8:00 AM with whatever you have answered. Miss the window entirely = 0 marks. No exceptions. Real exams have real consequences — so does CentuMania.',
            },
            {
              q: 'How long is each test?',
              a: '30 minutes. Each daily test opens at 6:00 AM and auto-submits at 8:00 AM sharp — but you only need 30 minutes of focused effort. Start anytime within the window. Once submitted (or auto-submitted), it cannot be reopened.',
            },
            {
              q: 'I already have material. Why pay for this?',
              a: "Material was never your problem. What you don't have is a system that forces you to show up every single day with real consequences. That's what you're paying for.",
            },
            {
              q: 'How does the 50% cashback work?',
              a: 'Attend all 15 daily tests within the 6:00–8:00 AM window. After the exam, we verify attendance automatically and process the refund within 7 business days.',
            },
            {
              q: "What's the complimentary LDC access offer?",
              a: 'UDC students who enrol within 2 days receive complimentary access to the LDC programme at no extra charge. Join UDC, get LDC free. The offer expires after the 2-day window.',
            },
            {
              q: 'When does the UDC batch start?',
              a: 'UDC batch dates are yet to be confirmed. Register your interest now — you will be the first to know when the batch opens and get priority access.',
            },
            {
              q: 'Can I join after the batch starts?',
              a: 'No. The cohort is sealed when the batch begins. First paid, first in. Enrollment closes permanently once the first test goes live.',
            },
          ].map((item, i) => (
            <div key={i} style={{ border:`1px solid ${C.borderFaint}`, borderRadius:12, overflow:'hidden' }}>
              <button
                onClick={() => setFaq(faq === i ? null : i)}
                style={{ width:'100%', textAlign:'left', padding:'20px 24px', backgroundColor:faq===i?'rgba(74,222,128,0.05)':'transparent', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', border:'none', color:C.text, fontSize:16, ...SANS, fontWeight:faq===i?600:400, gap:16 }}>
                <span style={{ lineHeight:1.4 }}>{item.q}</span>
                <span style={{ color:C.green, fontSize:22, lineHeight:1, flexShrink:0 }}>{faq===i?'−':'+'}</span>
              </button>
              {faq===i && <div style={{ padding:'0 24px 20px', color:C.muted, fontSize:15, lineHeight:1.72 }}>{item.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section style={{ padding:'100px 24px', textAlign:'center', borderTop:`1px solid ${C.border}`, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:700, height:350, background:'radial-gradient(ellipse, rgba(74,222,128,0.09) 0%, transparent 68%)', pointerEvents:'none' }} />
        <div style={{ maxWidth:600, margin:'0 auto', position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:40 }}>
            <Logo size={56} />
          </div>
          <p style={{ color:C.muted, fontSize:13, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12, fontWeight:600 }}>
            LDC Exam · June 28, 2026
          </p>
          <h2 style={{ ...D, fontWeight:900, fontSize:'clamp(44px,9vw,80px)', letterSpacing:'-0.04em', lineHeight:0.9, marginBottom:28 }}>
            LDC Exam starts in<br />
            <span style={{ color:C.green, display:'inline-flex', alignItems:'baseline', gap:8 }}>
              {daysLeft !== null ? daysLeft : '—'}
              <span style={{ fontSize:'0.55em', letterSpacing:'0.02em', fontWeight:700 }}>days.</span>
            </span>
          </h2>
          <p style={{ color:C.muted, fontSize:17, lineHeight:1.7, marginBottom:48 }}>
            Either you build the habit before the exam, or you spend the next year asking yourself why you didn't start.
          </p>
          <Link href="/auth/register" className="btn-p" style={{ display:'inline-block', backgroundColor:C.green, color:'#040C04', fontWeight:700, fontSize:20, padding:'20px 60px', borderRadius:14, textDecoration:'none', letterSpacing:'-0.01em', marginBottom:18 }}>
            Claim My Seat →
          </Link>
          <p style={{ color:C.muted, fontSize:13 }}>UDC & LDC 2026 · Enrollment closes when batch starts</p>
        </div>
      </section>

      {/* ── INSTAGRAM ────────────────────────────────────────────── */}
      <section style={{ padding:'56px 24px', textAlign:'center', borderTop:`1px solid ${C.borderFaint}` }}>
        <p style={{ color:C.muted, fontSize:13, marginBottom:20 }}>For more updates follow CentuMania</p>
        <a
          href="https://www.instagram.com/centumania_official/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display:'inline-flex', alignItems:'center', gap:16, textDecoration:'none', backgroundColor:C.surface, border:`1px solid rgba(221,42,123,0.30)`, borderRadius:16, padding:'18px 32px', cursor:'pointer' }}
        >
          {/* Instagram gradient icon */}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink:0 }}>
            <defs>
              <linearGradient id="ig" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#F58529" />
                <stop offset="50%"  stopColor="#DD2A7B" />
                <stop offset="100%" stopColor="#833AB4" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="url(#ig)" strokeWidth="2"/>
            <circle cx="12" cy="12" r="4.5" stroke="url(#ig)" strokeWidth="2"/>
            <circle cx="17.2" cy="6.8" r="1.3" fill="url(#ig)"/>
          </svg>
          <div style={{ textAlign:'left' }}>
            <p style={{ ...D, fontWeight:900, fontSize:20, letterSpacing:'-0.025em', lineHeight:1, margin:0 }}>
              <span style={{ color:C.text }}>Centu</span><span style={{ color:C.green }}>Mania</span>
            </p>
            <p style={{ color:C.muted, fontSize:13, marginTop:3 }}>@centumania_official</p>
          </div>
          <span style={{ color:'#DD2A7B', fontSize:20, marginLeft:4 }}>→</span>
        </a>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.05)', padding:'36px 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
          <Logo size={26} />
          <p style={{ color:C.muted, fontSize:13 }}>centumania.co.in · Puducherry · LDC/UDC 2026</p>
          <div style={{ display:'flex', gap:24 }}>
            <Link href="/auth/login"    style={{ color:C.muted, fontSize:13, textDecoration:'none' }}>Sign In</Link>
            <Link href="/auth/register" style={{ color:C.green, fontSize:13, textDecoration:'none', fontWeight:600 }}>Join Now →</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
