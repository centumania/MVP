# Carbon + Indigo + Gold Dark Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current Bio Map Forest Green theme with the v3 Carbon Black + Centumania Indigo + Champion Gold design system shown in centumania-ui-preview.html.

**Architecture:** Two-file change — `globals.css` replaces all design tokens; `layout.tsx` swaps fonts from Fraunces/Hanken/JetBrains to Bebas Neue + Inter. CSS custom properties cascade automatically to all components.

**Tech Stack:** Next.js 16, Tailwind v4, next/font/google (Inter + Bebas_Neue)

**Source of truth:** `/Users/prasannakumar/Documents/Claude/Projects/UI architect (1)/centumania-ui-preview.html`

---

### Design Token Mapping

| Token | From (Bio Map) | To (Carbon+Indigo+Gold) |
|-------|---------------|------------------------|
| bg | `#0e1410` | `#0B1020` |
| surface | `#16201a` | `#111827` |
| primary | `#4ADE80` | `#2533FF` |
| gold | `#e7b14c` | `#F6B300` (achievement only) |
| text | `#e8ead8` | `#F9FAFB` |
| font-display | Fraunces | Bebas Neue |
| font-sans | Hanken Grotesk | Inter |
| font-mono | JetBrains Mono | Inter |

---

### Task 1: Rewrite globals.css design tokens

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace @theme block** — swap all color tokens to Carbon+Indigo+Gold system, add Bebas Neue font var.

Replace the entire `@theme { ... }` block with:

```css
@theme {
  /* ── Primary — Centumania Indigo ─────────────────────────────────── */
  --color-primary:          #2533FF;
  --color-primary-hover:    #1e28e0;
  --color-primary-active:   #1820c8;
  --color-primary-subtle:   rgba(37,51,255,0.08);
  --color-primary-muted:    rgba(37,51,255,0.16);
  --color-primary-border:   rgba(37,51,255,0.30);
  --color-primary-tint:     rgba(37,51,255,0.12);

  /* ── Surfaces — Carbon Dark ─────────────────────────────────────── */
  --color-bg:               #0B1020;
  --color-bg2:              #111827;
  --color-surface:          #111827;
  --color-surface-raised:   #161d2e;
  --color-surface-overlay:  #1e293b;
  --color-surface-sunken:   #080d18;

  /* ── Borders ────────────────────────────────────────────────────── */
  --color-border:           rgba(255,255,255,0.08);
  --color-border-strong:    rgba(255,255,255,0.14);
  --color-border-focus:     #2533FF;

  /* ── Text ───────────────────────────────────────────────────────── */
  --color-text:             #F9FAFB;
  --color-text-secondary:   #CBD5E1;
  --color-text-muted:       #9CA3AF;
  --color-text-faint:       #6B7280;
  --color-text-disabled:    #4B5563;
  --color-text-inverse:     #0B1020;

  /* ── Semantic ───────────────────────────────────────────────────── */
  --color-success:          #22C55E;
  --color-success-subtle:   rgba(34,197,94,0.12);
  --color-success-text:     #4ADE80;

  --color-warning:          #FBBF24;
  --color-warning-subtle:   rgba(251,191,36,0.12);
  --color-warning-text:     #FDE68A;

  --color-error:            #E3413A;
  --color-error-subtle:     rgba(227,65,58,0.10);
  --color-error-text:       #FCA5A5;

  --color-info:             #2563EB;
  --color-info-subtle:      rgba(37,99,235,0.10);

  /* ── Champion Gold — Achievement ONLY ──────────────────────────── */
  --color-gold:             #F6B300;
  --color-gold-subtle:      rgba(246,179,0,0.12);
  --color-gold-text:        #FDE68A;

  /* ── Mentor Teal — AI content ONLY ─────────────────────────────── */
  --color-mentor-teal:      #0EA5A0;

  /* ── Streak Amber ────────────────────────────────────────────────── */
  --color-streak-amber:     #F97316;

  /* ── Typography ──────────────────────────────────────────────────── */
  --font-display: var(--font-bebas), 'Bebas Neue', sans-serif;
  --font-sans:    var(--font-inter), 'Inter', system-ui, sans-serif;
  --font-mono:    var(--font-inter), 'Inter', ui-monospace, monospace;

  /* Legacy compat (components still referencing these vars) */
  --font-fraunces:  var(--font-bebas), 'Bebas Neue', sans-serif;
  --font-hanken:    var(--font-inter), 'Inter', system-ui, sans-serif;
  --font-jetbrains: var(--font-inter), 'Inter', ui-monospace, monospace;

  /* ── Elevation ───────────────────────────────────────────────────── */
  --shadow-xs:  0 1px 2px rgba(0,0,0,0.25);
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.20);
  --shadow-md:  0 4px 12px rgba(0,0,0,0.40), 0 2px 4px rgba(0,0,0,0.20);
  --shadow-lg:  0 12px 28px rgba(0,0,0,0.50), 0 4px 8px rgba(0,0,0,0.25);
  --shadow-xl:  0 24px 48px rgba(0,0,0,0.60);
  --shadow-primary: 0 6px 20px rgba(37,51,255,0.35);
  --radius:     14px;
}
```

- [ ] **Step 2: Update body styles** — switch bg + remove bio map gradient/noise, use Inter

Replace the `body { ... }` block:

```css
body {
  background-color: #0B1020;
  color: #F9FAFB;
  font-family: var(--font-inter, 'Inter'), system-ui, -apple-system, sans-serif;
  font-size: 16px;
  line-height: 1.55;
  letter-spacing: -0.011em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}
```

Also remove the `body::before` noise texture block entirely.

- [ ] **Step 3: Update focus, selection, scrollbar**

```css
:focus-visible {
  outline: 2px solid #2533FF;
  outline-offset: 2px;
  border-radius: 6px;
}

::selection {
  background-color: rgba(37,51,255,0.20);
  color: #F9FAFB;
}

::-webkit-scrollbar        { width: 4px; height: 4px; }
::-webkit-scrollbar-track  { background: transparent; }
::-webkit-scrollbar-thumb  { background: rgba(37,51,255,0.25); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(37,51,255,0.45); }
```

- [ ] **Step 4: Update glass morphism classes**

```css
.glass {
  background: rgba(17,24,39,0.80);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.08);
}

.glass-strong {
  background: rgba(17,24,39,0.92);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(37,51,255,0.20);
}

.surface-blur {
  background: rgba(11,16,32,0.92);
  backdrop-filter: saturate(180%) blur(16px);
  -webkit-backdrop-filter: saturate(180%) blur(16px);
}
```

- [ ] **Step 5: Update glow and gradient classes**

```css
.glow-primary { box-shadow: 0 6px 20px rgba(37,51,255,0.35); }
.glow-success { box-shadow: 0 6px 20px rgba(34,197,94,0.25); }
.glow-gold    { box-shadow: 0 6px 20px rgba(246,179,0,0.30); }

.border-gradient-green { position: relative; }
.border-gradient-green::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(37,51,255,0.6), rgba(37,51,255,0.08));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

- [ ] **Step 6: Update skeleton shimmer to indigo tints**

```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(37,51,255,0.04) 0%,
    rgba(37,51,255,0.10) 50%,
    rgba(37,51,255,0.04) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}
```

- [ ] **Step 7: Update input-premium styles**

```css
.input-premium {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  font-size: 0.875rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 10px;
  color: #F9FAFB;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input-premium:focus {
  outline: none;
  border-color: rgba(37,51,255,0.60);
  box-shadow: 0 0 0 3px rgba(37,51,255,0.15);
}
input::placeholder, textarea::placeholder { color: #6B7280; }
```

---

### Task 2: Update layout.tsx — swap fonts to Inter + Bebas Neue

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace font imports**

```tsx
import { Inter, Bebas_Neue } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
  weight: ['400'],
})
```

Remove the `fraunces`, `hankenGrotesk`, `jetbrainsMono` const declarations.

- [ ] **Step 2: Update html className**

```tsx
className={`${inter.variable} ${bebasNeue.variable}`}
```

- [ ] **Step 3: Update themeColor and skip-link**

```tsx
themeColor: [
  { media: '(prefers-color-scheme: dark)',  color: '#0B1020' },
  { media: '(prefers-color-scheme: light)', color: '#0B1020' },
],
```

Skip-to-content link:
```tsx
style={{ background: '#2533FF', color: '#F9FAFB' }}
```

---

### Task 3: Commit

- [ ] Stage and commit

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: v3 Carbon+Indigo+Gold dark theme — Bebas Neue + Inter font stack

Replaces Bio Map forest green with Carbon Black (#0B1020) + Centumania
Indigo (#2533FF) + Champion Gold (#F6B300) design system from ui-preview.
Swaps Fraunces/Hanken/JetBrains for Bebas Neue (display) + Inter (body).
Legacy font vars remapped for backwards compat with existing components."
```
