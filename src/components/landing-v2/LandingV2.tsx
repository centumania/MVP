/**
 * Landing v2 — assembly.
 * Premium light-theme redesign (Sky/Indigo/Emerald on #FAFAF8).
 * Fully additive: lives beside the original landing page, which remains
 * untouched at src/components/landing/LandingPage.tsx.
 *
 * Section order is the conversion narrative:
 * Hero (promise + product proof) → Problem (why alone fails) →
 * Features (the system) → Centum Index (unique mechanism) →
 * Refund (risk reversal) → Testimonials (social proof) →
 * Pricing (offer) → FAQ (objections) → Closing (final push).
 */
import Nav from './Nav'
import MotionStyles from './MotionStyles'
import Hero from './Hero'
import TrustBar from './TrustBar'
import Problem from './Problem'
import Features from './Features'
import ProductTour from './ProductTour'
import KnowledgeUniverse from './KnowledgeUniverse'
import CentumIndex from './CentumIndex'
import Refund from './Refund'
import Testimonials from './Testimonials'
import Founder from './Founder'
import Pricing from './Pricing'
import Faq from './Faq'
import LeadForm from './LeadForm'
import Closing from './Closing'

/* Scroll-reveal, logo 3D hover, tagline highlight and card tilt.
   Kept in CSS so prefers-reduced-motion is a pure media-query concern. */
const REVEAL_CSS = `
.lv2-reveal{opacity:0;transform:translateY(20px);transition:opacity .6s cubic-bezier(.21,.65,.36,1),transform .6s cubic-bezier(.21,.65,.36,1);will-change:opacity,transform;}
.lv2-reveal.lv2-shown{opacity:1;transform:none;}
.lv2-logo-wrap{display:inline-flex;flex-shrink:0;perspective:520px;animation:lv2-float 5s ease-in-out infinite;}
.lv2-logo{transform-style:preserve-3d;transition:transform .5s cubic-bezier(.21,.65,.36,1),filter .5s ease;filter:drop-shadow(0 2px 5px rgba(16,89,187,.30));border-radius:50%;}
.lv2-logo-wrap:hover .lv2-logo{transform:rotateY(24deg) rotateX(14deg) scale(1.15);filter:drop-shadow(0 14px 24px rgba(16,89,187,.45));}
@keyframes lv2-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.lv2-tagline{display:inline-block;font-style:italic;font-weight:800;letter-spacing:-.02em;background:linear-gradient(120deg,#fde68a 0%,#fbbf24 100%);color:#78350f;padding:5px 16px;border-radius:10px;transform:rotate(-1.2deg);box-shadow:0 3px 12px rgba(245,158,11,.28);}
.lv2-card3d{transform-style:preserve-3d;transition:transform .45s cubic-bezier(.21,.65,.36,1),box-shadow .45s ease;}
.lv2-card3d:hover{transform:perspective(900px) rotateX(3deg) rotateY(-3deg) translateY(-6px);}
@media (prefers-reduced-motion: reduce){
  .lv2-reveal{transition:none;transform:none;opacity:1;}
  .lv2-logo-wrap{animation:none;}
  .lv2-logo,.lv2-card3d{transition:none;}
  .lv2-logo-wrap:hover .lv2-logo,.lv2-card3d:hover{transform:none;}
}
`

export default function LandingV2() {
  return (
    <div
      className="min-h-screen bg-[#FAFAF8] text-gray-900 antialiased"
      style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}
    >
      <style>{REVEAL_CSS}</style>
      <MotionStyles />
      <Nav />
      <main id="main-content">
        <Hero />
        <TrustBar />
        <Problem />
        <Features />
        <ProductTour />
        <KnowledgeUniverse />
        <CentumIndex />
        <Refund />
        <Testimonials />
        <Founder />
        <Pricing />
        <Faq />
        <LeadForm />
        <Closing />
      </main>
    </div>
  )
}
