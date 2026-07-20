/**
 * Landing v2 — shared premium motion utilities (server component).
 *
 * Global, CSS-only helpers prefixed `lv2m-`. Rendered once by LandingV2.
 * Rules:
 *  - Everything lives inside @media (prefers-reduced-motion: no-preference),
 *    so reduced-motion users get a fully static page for free.
 *  - Only transform / opacity / box-shadow / filter are animated — never layout.
 *  - Theme-locked tints: sky (primary) and emerald (trust) glows only.
 */
export default function MotionStyles() {
  return (
    <style
      // Global stylesheet (not styled-jsx) — safe in a server component.
      dangerouslySetInnerHTML={{
        __html: `
@media (prefers-reduced-motion: no-preference) {

  /* lv2m-tilt — subtle 3D card tilt on hover (perspective + rotateX/rotateY). */
  .lv2m-tilt {
    transform: perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0);
    transition: transform 220ms ease, box-shadow 220ms ease;
    will-change: transform;
  }
  .lv2m-tilt:hover {
    transform: perspective(900px) rotateX(2deg) rotateY(-2deg) translateY(-3px);
  }

  /* lv2m-lift — card lift with a soft sky-tinted glow shadow. */
  .lv2m-lift {
    transition: transform 200ms ease, box-shadow 200ms ease;
  }
  .lv2m-lift:hover {
    transform: translateY(-4px);
    box-shadow:
      0 14px 30px -10px rgba(2, 132, 199, 0.22),
      0 4px 10px rgba(16, 24, 40, 0.06);
  }

  /* lv2m-lift-emerald — same lift, emerald (trust) glow. */
  .lv2m-lift-emerald {
    transition: transform 200ms ease, box-shadow 200ms ease;
  }
  .lv2m-lift-emerald:hover {
    transform: translateY(-4px);
    box-shadow:
      0 14px 30px -10px rgba(5, 150, 105, 0.24),
      0 4px 10px rgba(16, 24, 40, 0.06);
  }

  /* lv2m-sheen — light sweep across primary CTAs (gradient ::after slides through). */
  .lv2m-sheen {
    position: relative;
    overflow: hidden;
  }
  .lv2m-sheen::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 40%;
    background: linear-gradient(105deg, transparent 0%, rgba(255, 255, 255, 0.35) 50%, transparent 100%);
    transform: translateX(-160%) skewX(-18deg);
    transition: transform 600ms ease;
    pointer-events: none;
  }
  .lv2m-sheen:hover::after {
    transform: translateX(360%) skewX(-18deg);
  }

  /* lv2m-float — gentle idle bob for hero art / large mockups. */
  .lv2m-float {
    animation: lv2m-float 6s ease-in-out infinite;
    will-change: transform;
  }
  @keyframes lv2m-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
}
`,
      }}
    />
  )
}
