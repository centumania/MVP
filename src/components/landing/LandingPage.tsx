'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LogoFull } from '@/src/components/ui/Logo'

// ── Design tokens — Execution OS (light, institutional) ───────────
const C = {
  primary:      '#0B3D91',
  primaryDark:  '#0A357D',
  teal:         '#00C897',
  tealTint:     '#E6FAF4',
  bg:           '#FFFFFF',
  bgAlt:        '#F8FAFC',
  surface:      '#FFFFFF',
  surface2:     '#F1F5F9',
  primaryTint:  '#EEF3FB',
  text:         '#111827',
  text2:        '#4B5563',
  muted:        '#6B7280',
  gold:         '#FFB703',
  goldText:     '#B45309',
  goldBg:       '#FFF7E6',
  goldBorder:   'rgba(255,183,3,0.35)',
  border:       '#E5E7EB',
  borderStrong: '#D1D5DB',
  red:          '#EF4444',
}
const SANS: React.CSSProperties = { fontFamily: "var(--font-inter, 'Inter'), system-ui, sans-serif" }
const D: React.CSSProperties = { ...SANS, letterSpacing: '-0.03em' }

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
        @keyframes fadeUp  { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        .anim-label { animation: fadeUp .5s .05s cubic-bezier(.16,1,.3,1) both }
        .anim-h1    { animation: fadeUp .6s .12s cubic-bezier(.16,1,.3,1) both }
        .anim-sub   { animation: fadeUp .6s .22s cubic-bezier(.16,1,.3,1) both }
        .anim-cta   { animation: fadeUp .6s .32s cubic-bezier(.16,1,.3,1) both }
        .btn-p { transition: background .18s, transform .15s, box-shadow .18s; box-shadow:0 6px 20px rgba(11,61,145,0.18) }
        .btn-p:hover { background:${C.primaryDark}!important; transform:translateY(-1px); box-shadow:0 10px 26px rgba(11,61,145,0.24) }
        .btn-o { transition: background .18s, border-color .18s }
        .btn-o:hover { background:${C.primaryTint}; border-color:${C.borderStrong} }
        .lift  { transition: border-color .2s, transform .2s, box-shadow .2s }
        .lift:hover { transform:translateY(-3px); box-shadow:0 16px 36px rgba(16,24,40,.10) }
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────────── */}
      <nav className="surface-blur" style={{ position:'sticky', top:0, zIndex:50, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1120, margin:'0 auto', padding:'0 24px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <LogoFull size={30} />
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <Link href="/auth/login" style={{ color:C.text2, fontSize:14, fontWeight:500, padding:'8px 16px', textDecoration:'none' }}>Sign In</Link>
            <Link href="/auth/register" className="btn-p" style={{ backgroundColor:C.primary, color:'#fff', fontWeight:600, fontSize:14, padding:'10px 22px', borderRadius:10, textDecoration:'none' }}>
              Start My Preparation
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ position:'relative', padding:'92px 24px 72px', textAlign:'center', backgroundColor:C.bgAlt, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:780, margin:'0 auto', position:'relative', zIndex:1 }}>
          <div className="anim-label" style={{ display:'inline-flex', alignItems:'center', gap:8, backgroundColor:'#fff', border:`1px solid ${C.border}`, borderRadius:100, padding:'6px 16px', marginBottom:26, boxShadow:'0 1px 2px rgba(16,24,40,0.04)' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', backgroundColor:C.teal }} />
            <span style={{ fontSize:12.5, fontWeight:600, color:C.text2, letterSpacing:'0.01em' }}>India&apos;s Daily Execution System for Competitive Exams</span>
          </div>
          <h1 className="anim-h1" style={{ ...D, fontWeight:800, fontSize:'clamp(38px,7vw,64px)', lineHeight:1.04, marginBottom:22, color:C.text }}>
            Stop wondering what to study.<br /><span style={{ color:C.primary }}>Start executing every day.</span>
          </h1>
          <p className="anim-sub" style={{ fontSize:18, color:C.text2, lineHeight:1.6, maxWidth:560, margin:'0 auto 36px' }}>
            One daily mission. A live leaderboard. An AI mentor after every test. Show up daily, complete the mission, climb the rankings — and earn up to 50% back.
          </p>
          <div className="anim-cta" style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginBottom:22 }}>
            <Link href="/auth/register" className="btn-p" style={{ backgroundColor:C.primary, color:'#fff', fontWeight:700, fontSize:17, padding:'16px 38px', borderRadius:12, textDecoration:'none' }}>
              Start My Preparation →
            </Link>
            <a href="#how" className="btn-o" style={{ color:C.text, fontWeight:600, fontSize:16, padding:'16px 30px', borderRadius:12, textDecoration:'none', border:`1px solid ${C.borderStrong}`, backgroundColor:'#fff' }}>
              See How It Works
            </a>
          </div>
          <p style={{ color:C.muted, fontSize:13 }}>UDC &amp; LDC · 15-day intensive · LDC exam June 28, 2026</p>
        </div>
      </section>

      {/* ── TRUST / DAILY TEST BAR ───────────────────────────────── */}
      <div style={{ backgroundColor:C.surface, borderBottom:`1px solid ${C.border}`, padding:'20px 24px' }}>
        <div style={{ maxWidth:920, margin:'0 auto', display:'flex', justifyContent:'center', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:8, color:C.primary, fontWeight:700, fontSize:13, letterSpacing:'0.04em', textTransform:'uppercase' }}>
            <span style={{ width:8, height:8, borderRadius:'50%', backgroundColor:C.teal, display:'inline-block' }} />
            Daily Test
          </span>
          <span style={{ color:C.border, fontSize:13 }}>|</span>
          <span style={{ ...D, fontWeight:800, fontSize:22, color:C.text }}>6:00 AM – 8:00 AM</span>
          <span style={{ color:C.border, fontSize:13 }}>|</span>
          <span style={{ color:C.muted, fontSize:13.5 }}>30-min test · Auto-submits at 8:00 AM · Server-enforced IST</span>
        </div>
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section id="how" style={{ padding:'88px 24px', maxWidth:1080, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <p style={{ color:C.primary, fontSize:12.5, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>The Execution System</p>
          <h2 style={{ ...D, fontWeight:800, fontSize:'clamp(30px,5vw,44px)', lineHeight:1.08, color:C.text }}>Four steps. Every single day.</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:20 }}>
          {[
            { n:'01', t:'Show up daily', d:'Open your daily mission at 6 AM. One clear task — no decision fatigue, no guesswork.' },
            { n:'02', t:'Complete the mission', d:'A focused 30-minute test. It auto-submits at 8 AM sharp. Real deadlines build real discipline.' },
            { n:'03', t:'Climb the rankings', d:'Live leaderboard and Centum Index show exactly where you stand against every aspirant.' },
            { n:'04', t:'Earn your refund', d:'Perfect attendance earns up to 50% cashback. Consistency literally pays you back.' },
          ].map(s => (
            <div key={s.n} className="lift" style={{ backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:'28px 24px', boxShadow:'0 1px 3px rgba(16,24,40,0.06)' }}>
              <div style={{ ...D, fontSize:15, fontWeight:800, color:C.teal, marginBottom:14 }}>{s.n}</div>
              <h3 style={{ ...D, fontWeight:700, fontSize:18, color:C.text, marginBottom:8 }}>{s.t}</h3>
              <p style={{ color:C.text2, fontSize:14.5, lineHeight:1.6, margin:0 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROGRAMME HIERARCHY ──────────────────────────────────── */}
      <section id="programmes" style={{ padding:'40px 24px 96px', maxWidth:1080, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <p style={{ color:C.primary, fontSize:12.5, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>Programmes</p>
          <h2 style={{ ...D, fontWeight:800, fontSize:'clamp(30px,5vw,44px)', color:C.text }}>Choose your path to victory</h2>
        </div>
        <div style={{ display:'flex', gap:20, flexWrap:'wrap', alignItems:'stretch' }}>

          {/* UDC — FLAGSHIP */}
          <div className="lift" style={{ flex:'1 1 340px', backgroundColor:C.surface, border:`2px solid ${C.primary}`, borderRadius:24, padding:'44px 36px', position:'relative', boxShadow:'0 8px 28px rgba(11,61,145,0.10)' }}>
            <div style={{ position:'absolute', top:-13, left:28, backgroundColor:C.primary, color:'#fff', fontSize:11, fontWeight:700, padding:'5px 16px', borderRadius:100, letterSpacing:'0.05em' }}>
              FLAGSHIP PROGRAMME
            </div>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:22 }}>
              <div>
                <div style={{ color:C.muted, fontSize:12, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4, fontWeight:600 }}>Upper Division Clerk</div>
                <h3 style={{ ...D, fontWeight:800, fontSize:48, lineHeight:1, color:C.text }}>UDC</h3>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:12, flexWrap:'wrap' }}>
                  <span style={{ ...D, fontSize:20, fontWeight:600, color:C.muted, textDecoration:'line-through' }}>₹1,499</span>
                  <span style={{ ...D, fontSize:36, fontWeight:800, color:C.primary, lineHeight:1 }}>₹999</span>
                  <span style={{ backgroundColor:C.red, color:'#fff', fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:100 }}>33% OFF</span>
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, backgroundColor:C.goldBg, border:`1px solid ${C.goldBorder}`, borderRadius:8, padding:'5px 12px', marginTop:12 }}>
                  <span style={{ color:C.goldText, fontSize:12, fontWeight:700 }}>⏰ Exclusive price — valid for 2 days only</span>
                </div>
              </div>
              <div style={{ marginLeft:'auto', backgroundColor:C.goldBg, border:`1px solid ${C.goldBorder}`, borderRadius:8, padding:'5px 12px', flexShrink:0 }}>
                <span style={{ color:C.goldText, fontSize:12, fontWeight:700 }}>★ Premium</span>
              </div>
            </div>
            <p style={{ color:C.text2, fontSize:15, lineHeight:1.6, marginBottom:24 }}>
              The flagship programme for Upper Division Clerk aspirants. Full syllabus coverage, daily tests, AI mentor reports, and live leaderboard competition. Batch details coming soon.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:11, marginBottom:16 }}>
              {[
                'Daily tests: 6:00 AM – 8:00 AM',
                '30-min test · Auto-submits at 8:00 AM',
                'Live leaderboard & Centum Index',
                'AI mentor report after each test',
              ].map(f => (
                <div key={f} style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <Check c={C.teal} />
                  <span style={{ color:C.text, fontSize:14.5 }}>{f}</span>
                </div>
              ))}
            </div>

            {/* LDC FREE callout */}
            <div style={{ backgroundColor:C.tealTint, border:`1px solid rgba(0,200,151,0.30)`, borderRadius:12, padding:'16px 18px', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                <p style={{ color:'#047857', fontWeight:700, fontSize:15, margin:0 }}>🎁 LDC worth</p>
                <span style={{ ...D, fontSize:19, fontWeight:700, color:C.muted, textDecoration:'line-through' }}>₹499</span>
                <span style={{ backgroundColor:C.teal, color:'#04372B', fontWeight:800, fontSize:13, padding:'2px 10px', borderRadius:100 }}>FREE</span>
              </div>
              <p style={{ color:C.text2, fontSize:13.5, lineHeight:1.55, margin:0 }}>
                Join UDC today and get complete LDC content — every test, every material — at no extra cost. Two programmes. One price.
              </p>
            </div>

            <div style={{ backgroundColor:C.goldBg, border:`1px solid ${C.goldBorder}`, borderRadius:10, padding:'10px 14px', marginBottom:20, textAlign:'center' }}>
              <span style={{ color:C.goldText, fontSize:12.5, fontWeight:700 }}>⏰ Free LDC access valid only if you join within 2 days</span>
            </div>

            <Link href="/auth/register" className="btn-p" style={{ display:'block', textAlign:'center', backgroundColor:C.primary, color:'#fff', fontWeight:700, fontSize:16, padding:'15px 0', borderRadius:12, textDecoration:'none' }}>
              Register Interest in UDC →
            </Link>
          </div>

          {/* LDC — SECONDARY */}
          <div className="lift" style={{ flex:'1 1 280px', backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:24, padding:'44px 32px', position:'relative', boxShadow:'0 1px 3px rgba(16,24,40,0.06)' }}>
            <div style={{ color:C.muted, fontSize:12, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:4, fontWeight:600 }}>Lower Division Clerk</div>
            <h3 style={{ ...D, fontWeight:800, fontSize:44, lineHeight:1, color:C.text, marginBottom:12 }}>LDC</h3>
            <div style={{ ...D, fontSize:36, fontWeight:800, color:C.primary, lineHeight:1, marginBottom:20 }}>₹499</div>
            <p style={{ color:C.text2, fontSize:15, lineHeight:1.6, marginBottom:24 }}>
              A focused 15-day foundation programme for LDC aspirants. Build the daily execution habit, compete on the leaderboard, and track your Centum Index.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:30 }}>
              {[
                '15-day foundation programme',
                'Daily tests: 6:00 AM – 8:00 AM',
                '30-min test · Auto-submits at 8:00 AM',
                'Live leaderboard & Centum Index',
                '50% cashback for perfect attendance',
              ].map(f => (
                <div key={f} style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <Check c={C.primary} />
                  <span style={{ color:C.text2, fontSize:14.5 }}>{f}</span>
                </div>
              ))}
            </div>
            <Link href="/auth/register" className="btn-o" style={{ display:'block', textAlign:'center', color:C.text, fontWeight:600, fontSize:15, padding:'14px 0', borderRadius:12, textDecoration:'none', border:`1px solid ${C.borderStrong}`, backgroundColor:'#fff' }}>
              Enrol in LDC
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────── */}
      <div style={{ borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:'44px 24px', backgroundColor:C.bgAlt }}>
        <div style={{ maxWidth:840, margin:'0 auto', display:'flex', justifyContent:'space-around', flexWrap:'wrap', gap:28 }}>
          {[
            {n:'15',   l:'Days of Discipline'},
            {n:'6 AM', l:'Test Window Opens'},
            {n:'30',   l:'Minutes Per Test'},
            {n:'50%',  l:'Cashback If You Earn It'},
          ].map(s => (
            <div key={s.n} style={{ textAlign:'center' }}>
              <div style={{ ...D, fontSize:42, fontWeight:800, color:C.primary, lineHeight:1 }}>{s.n}</div>
              <div style={{ color:C.muted, fontSize:13, marginTop:8, fontWeight:500 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI MENTOR REPORT ─────────────────────────────────────── */}
      <section style={{ padding:'92px 24px', maxWidth:1080, margin:'0 auto' }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:56, alignItems:'center' }}>
          <div style={{ flex:'1 1 340px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, backgroundColor:C.primaryTint, border:`1px solid rgba(11,61,145,0.18)`, borderRadius:100, padding:'5px 16px', marginBottom:22 }}>
              <span style={{ fontSize:13 }}>✦</span>
              <span style={{ color:C.primary, fontSize:12, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>Your Personal Coach</span>
            </div>
            <h2 style={{ ...D, fontWeight:800, fontSize:'clamp(30px,5vw,46px)', lineHeight:1.05, marginBottom:18, color:C.text }}>
              An AI mentor that tells you<br /><span style={{ color:C.primary }}>exactly what to fix next.</span>
            </h2>
            <p style={{ color:C.text2, fontSize:16, lineHeight:1.65, marginBottom:26 }}>
              After every daily test, CentuMania generates your personal coaching analysis. Not a generic result — a senior mentor&apos;s breakdown of where you stand and the precise next action.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { icon:'📊', t:'Strengths & Weak Topics',  d:'Pinpoints the exact subjects pulling your score down.' },
                { icon:'🎯', t:'Predicted Score Range',    d:'Estimates your likely marks on exam day based on trends.' },
                { icon:'🧠', t:'Learning Profile',         d:'Scholar, Sprinter, Late Bloomer — know how you study.' },
                { icon:'📋', t:"Today's Study Mission",    d:'Focused tasks with time estimates to fix your weak spots.' },
                { icon:'📈', t:'Exam Readiness Score',     d:'A live 0–100 index showing your actual preparation level.' },
              ].map(item => (
                <div key={item.t} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                  <span style={{ fontSize:18, lineHeight:1.4, flexShrink:0 }}>{item.icon}</span>
                  <div>
                    <span style={{ color:C.text, fontWeight:600, fontSize:15 }}>{item.t} — </span>
                    <span style={{ color:C.text2, fontSize:15 }}>{item.d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mock report card */}
          <div style={{ flex:'1 1 320px', backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:20, overflow:'hidden', boxShadow:'0 12px 32px rgba(16,24,40,0.10)' }}>
            <div style={{ padding:'16px 22px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10, backgroundColor:C.bgAlt }}>
              <span style={{ width:8, height:8, borderRadius:'50%', backgroundColor:C.teal, display:'inline-block' }} />
              <span style={{ color:C.primary, fontWeight:700, fontSize:12.5, letterSpacing:'0.04em' }}>AI MENTOR REPORT · Day 8</span>
            </div>
            <div style={{ padding:'22px', display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[
                  { l:'Readiness Score', v:'74%', hi:true },
                  { l:'Predicted Range', v:'68–76', hi:false },
                  { l:'Learning Profile', v:'Consistent Performer', hi:false },
                  { l:'Days Attended',   v:'8 / 8', hi:true },
                ].map(stat => (
                  <div key={stat.l} style={{ backgroundColor:C.surface2, borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ color:C.muted, fontSize:11, letterSpacing:'0.03em', textTransform:'uppercase', marginBottom:4, fontWeight:600 }}>{stat.l}</div>
                    <div style={{ ...D, fontSize:stat.l === 'Learning Profile' ? 13 : 20, fontWeight:800, color:stat.hi ? C.primary : C.text, lineHeight:1.2 }}>{stat.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16 }}>
                <div style={{ color:C.muted, fontSize:12, letterSpacing:'0.03em', textTransform:'uppercase', marginBottom:10, fontWeight:600 }}>Weak Topics — Recommended Actions</div>
                {[
                  { topic:'Current Affairs', pct:38, action:'Revise Polity quiz' },
                  { topic:'Arithmetic',      pct:44, action:'20 practice problems' },
                  { topic:'Reasoning',       pct:51, action:'Review Day 6 errors' },
                ].map(item => (
                  <div key={item.topic} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ color:C.text, fontSize:13, fontWeight:500 }}>{item.topic}</span>
                      <span style={{ color:C.primary, fontSize:12, fontWeight:600 }}>{item.action} →</span>
                    </div>
                    <div style={{ height:6, backgroundColor:C.surface2, borderRadius:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${item.pct}%`, backgroundColor: item.pct < 45 ? C.red : C.gold, borderRadius:4 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ backgroundColor:C.primaryTint, border:`1px solid rgba(11,61,145,0.15)`, borderRadius:10, padding:'12px 14px' }}>
                <div style={{ color:C.primary, fontSize:12, fontWeight:700, marginBottom:6 }}>📋 Today&apos;s Mission</div>
                <p style={{ color:C.text2, fontSize:13, lineHeight:1.55, margin:0 }}>Spend 45 min on Current Affairs (Polity focus). Attempt 20 Arithmetic problems. Review your Reasoning errors from Day 6.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REFUND SYSTEM ────────────────────────────────────────── */}
      <section style={{ padding:'72px 24px', backgroundColor:C.bgAlt, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:720, margin:'0 auto', textAlign:'center' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, backgroundColor:C.tealTint, border:`1px solid rgba(0,200,151,0.30)`, borderRadius:100, padding:'5px 18px', marginBottom:22 }}>
            <span style={{ color:'#047857', fontSize:12, fontWeight:700, letterSpacing:'0.05em' }}>CONSISTENCY PAYS YOU BACK</span>
          </div>
          <h2 style={{ ...D, fontWeight:800, fontSize:'clamp(30px,6vw,48px)', lineHeight:1.05, marginBottom:16, color:C.text }}>
            Attend every test. <span style={{ color:C.teal }}>Earn up to 50% back.</span>
          </h2>
          <p style={{ color:C.text2, fontSize:17, lineHeight:1.6, maxWidth:540, margin:'0 auto' }}>
            Attend all 15 daily tests within the 6:00–8:00 AM window. After the exam, attendance is verified automatically and your refund is processed within 7 business days. Discipline isn&apos;t just rewarded here — it&apos;s paid.
          </p>
        </div>
      </section>

      {/* ── SCARCITY ─────────────────────────────────────────────── */}
      <section style={{ padding:'88px 24px', textAlign:'center' }}>
        <div style={{ maxWidth:720, margin:'0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, border:`1px solid ${C.goldBorder}`, borderRadius:100, padding:'5px 20px', marginBottom:26, backgroundColor:C.goldBg }}>
            <span style={{ color:C.gold, fontSize:11 }}>●</span>
            <span style={{ color:C.goldText, fontSize:12, fontWeight:700, letterSpacing:'0.05em' }}>LIMITED AVAILABILITY</span>
          </div>
          <h2 style={{ ...D, fontWeight:800, fontSize:'clamp(34px,7vw,60px)', lineHeight:1.0, marginBottom:18, color:C.text }}>
            Seats don&apos;t wait<br />for readiness.
          </h2>
          <p style={{ ...D, fontSize:'clamp(19px,4vw,26px)', fontWeight:700, color:C.primary, marginBottom:22 }}>
            Act now or watch someone else take your seat.
          </p>
          <p style={{ color:C.text2, fontSize:17, lineHeight:1.6, maxWidth:520, margin:'0 auto 36px' }}>
            This is a structured cohort — not a subscription you sign up for and forget. One batch, one shot. When it fills, enrollment closes permanently.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginBottom:30 }}>
            {[
              {label:'June 28', sub:'LDC Exam Date'},
              {label:'15',      sub:'Days of Preparation'},
              {label:'6 AM',    sub:'Test Opens Daily'},
            ].map(item => (
              <div key={item.label} style={{ backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:'18px 28px', textAlign:'center', minWidth:120, boxShadow:'0 1px 3px rgba(16,24,40,0.06)' }}>
                <div style={{ ...D, fontSize:28, fontWeight:800, color:C.text, lineHeight:1 }}>{item.label}</div>
                <div style={{ color:C.muted, fontSize:12.5, marginTop:6 }}>{item.sub}</div>
              </div>
            ))}
          </div>
          <Link href="/auth/register" className="btn-p" style={{ display:'inline-block', backgroundColor:C.primary, color:'#fff', fontWeight:700, fontSize:17, padding:'15px 40px', borderRadius:12, textDecoration:'none' }}>
            Secure My Seat Now →
          </Link>
          <p style={{ color:C.muted, fontSize:14, marginTop:16 }}>Special offer available if you join today</p>
        </div>
      </section>

      {/* ── OFFER CARD ───────────────────────────────────────────── */}
      <section style={{ padding:'24px 24px 80px', maxWidth:760, margin:'0 auto' }}>
        <div className="lift" style={{ backgroundColor:C.primary, borderRadius:24, padding:'52px 40px', textAlign:'center', position:'relative', overflow:'hidden', boxShadow:'0 20px 48px rgba(11,61,145,0.22)' }}>
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', justifyContent:'center', gap:10, flexWrap:'wrap', marginBottom:26 }}>
              <div style={{ backgroundColor:'rgba(255,255,255,0.14)', borderRadius:100, padding:'5px 18px', fontSize:12, color:'#fff', fontWeight:700, letterSpacing:'0.04em' }}>
                🎁 EXCLUSIVE OFFER
              </div>
              <div style={{ backgroundColor:'rgba(255,183,3,0.20)', border:'1px solid rgba(255,183,3,0.45)', borderRadius:100, padding:'5px 18px', fontSize:12, color:'#FFE9B0', fontWeight:700, letterSpacing:'0.04em' }}>
                ⏰ VALID FOR 2 DAYS ONLY
              </div>
            </div>
            <h3 style={{ ...D, fontWeight:800, fontSize:'clamp(30px,6vw,46px)', lineHeight:1.04, marginBottom:14, color:'#fff' }}>
              Join within the next<br /><span style={{ color:'#9DBCF0' }}>2 days.</span>
            </h3>
            <p style={{ ...D, fontSize:'clamp(19px,4vw,26px)', fontWeight:700, color:'#fff', marginBottom:26 }}>
              Get complimentary LDC access
            </p>
            <div style={{ backgroundColor:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:16, padding:'22px 36px', display:'inline-block', marginBottom:26 }}>
              <p style={{ color:'#C7D7F2', fontSize:13, marginBottom:8, letterSpacing:'0.03em', textTransform:'uppercase', fontWeight:600 }}>UDC Students Receive</p>
              <p style={{ ...D, fontWeight:800, fontSize:'clamp(24px,5vw,34px)', color:'#fff', lineHeight:1.1 }}>
                Complimentary<br />LDC Access
              </p>
            </div>
            <p style={{ color:'#C7D7F2', fontSize:16, lineHeight:1.6, maxWidth:480, margin:'0 auto 32px' }}>
              Enrol in UDC within 2 days and receive complimentary access to the LDC programme — at no extra cost.
            </p>
            <Link href="/auth/register" className="btn-p" style={{ display:'inline-block', backgroundColor:'#fff', color:C.primary, fontWeight:700, fontSize:18, padding:'16px 50px', borderRadius:12, textDecoration:'none', boxShadow:'0 8px 22px rgba(0,0,0,0.18)' }}>
              Claim This Offer →
            </Link>
            <p style={{ color:'#9DBCF0', fontSize:13, marginTop:14 }}>Offer expires in 2 days · Limited seats</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section style={{ padding:'24px 24px 80px', maxWidth:720, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <h2 style={{ ...D, fontWeight:800, fontSize:'clamp(30px,5vw,44px)', color:C.text }}>Questions, answered.</h2>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
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
            <div key={i} style={{ border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', backgroundColor:C.surface }}>
              <button
                onClick={() => setFaq(faq === i ? null : i)}
                style={{ width:'100%', textAlign:'left', padding:'18px 22px', backgroundColor: faq===i ? C.bgAlt : '#fff', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', border:'none', color:C.text, fontSize:16, ...SANS, fontWeight:600, gap:16 }}>
                <span style={{ lineHeight:1.4 }}>{item.q}</span>
                <span style={{ color:C.primary, fontSize:22, lineHeight:1, flexShrink:0 }}>{faq===i?'−':'+'}</span>
              </button>
              {faq===i && <div style={{ padding:'0 22px 20px', color:C.text2, fontSize:15, lineHeight:1.68 }}>{item.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section style={{ padding:'92px 24px', textAlign:'center', backgroundColor:C.bgAlt, borderTop:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:620, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:32 }}>
            <LogoFull size={48} />
          </div>
          <p style={{ color:C.muted, fontSize:13, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:14, fontWeight:600 }}>
            LDC Exam · June 28, 2026
          </p>
          <h2 style={{ ...D, fontWeight:800, fontSize:'clamp(38px,8vw,64px)', lineHeight:0.98, marginBottom:24, color:C.text }}>
            LDC exam starts in<br />
            <span style={{ color:C.primary, display:'inline-flex', alignItems:'baseline', gap:8 }}>
              {daysLeft !== null ? daysLeft : '—'}
              <span style={{ fontSize:'0.5em', fontWeight:700 }}>days.</span>
            </span>
          </h2>
          <p style={{ color:C.text2, fontSize:17, lineHeight:1.65, marginBottom:40 }}>
            Either you build the habit before the exam, or you spend the next year asking yourself why you didn&apos;t start.
          </p>
          <Link href="/auth/register" className="btn-p" style={{ display:'inline-block', backgroundColor:C.primary, color:'#fff', fontWeight:700, fontSize:19, padding:'18px 56px', borderRadius:14, textDecoration:'none', marginBottom:18 }}>
            Start My Preparation →
          </Link>
          <p style={{ color:C.muted, fontSize:13 }}>UDC &amp; LDC 2026 · Enrollment closes when batch starts</p>
        </div>
      </section>

      {/* ── INSTAGRAM ────────────────────────────────────────────── */}
      <section style={{ padding:'56px 24px', textAlign:'center', borderTop:`1px solid ${C.border}` }}>
        <p style={{ color:C.muted, fontSize:13.5, marginBottom:20 }}>For more updates follow CentuMania</p>
        <a
          href="https://www.instagram.com/centumania_official/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display:'inline-flex', alignItems:'center', gap:16, textDecoration:'none', backgroundColor:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:'16px 30px', cursor:'pointer', boxShadow:'0 1px 3px rgba(16,24,40,0.06)' }}
        >
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
            <LogoFull size={20} />
            <p style={{ color:C.muted, fontSize:13, marginTop:3 }}>@centumania_official</p>
          </div>
          <span style={{ color:'#DD2A7B', fontSize:20, marginLeft:4 }}>→</span>
        </a>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:'36px 24px', backgroundColor:C.surface }}>
        <div style={{ maxWidth:1120, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
          <LogoFull size={26} />
          <p style={{ color:C.muted, fontSize:13 }}>centumania.co.in · Puducherry · LDC/UDC 2026</p>
          <div style={{ display:'flex', gap:24 }}>
            <Link href="/auth/login"    style={{ color:C.muted, fontSize:13, textDecoration:'none' }}>Sign In</Link>
            <Link href="/auth/register" style={{ color:C.primary, fontSize:13, textDecoration:'none', fontWeight:600 }}>Start My Preparation →</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── Checkmark icon ────────────────────────────────────────────────
function Check({ c }: { c: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0 }}>
      <circle cx="12" cy="12" r="11" fill={c} opacity="0.12" />
      <path d="M7 12.5l3.2 3.2L17 9" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
