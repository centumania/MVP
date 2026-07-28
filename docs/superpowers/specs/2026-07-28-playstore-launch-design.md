# CentuMania — Google Play Store Launch (Design / Spec)

**Date:** 2026-07-28
**Branch:** `feat/playstore-app` (off `main`)
**Owner:** Rajan (manager persona) · Founder: Prasanna
**Status:** Approved direction — Phase A build in progress. Nothing deployed to production.

---

## 1. Goal

Ship CentuMania as an installable Android app on the Google Play Store, wrapping the
existing Next.js web app — **without** a rewrite, **without** paying Google a
commission, and **without** risking rejection/removal.

## 2. The two decisions that shape everything

### 2.1 Billing model — **Consumption-only** (founder approved)
Google Play's Payments policy requires Google Play Billing (15–30% cut) for digital
subscriptions sold **inside** an app. It also **explicitly permits** "consumption-only"
apps where users log in and access content purchased elsewhere, with **no in-app
purchasing options**. And it forbids leading users to any other payment method *inside*
the app ("Within an app, developers may not lead users to a payment method other than
Google Play's billing system").

**Therefore:** the Android app is **sign-in + study only**. No price, no UPI QR, no
"Pay" button, no link to `/payment` — *inside the app*. Students subscribe on the
**website** (existing manual UPI flow, untouched). The app reads `payment_verified`
and unlocks. Google's cut = **0%**. Fully compliant.

We deliberately do **not** use India "user choice / alternative billing" — it still owes
Google (standard fee − 4%) plus PCI-DSS + 24h reporting + fraud APIs, and rests on an
in-flux post-CCI regime. Consumption-only is cheaper and safer.

### 2.2 Packaging — **Capacitor** (founder approved)
Capacitor wraps the web app in a native shell with a reliable **app-mode flag**
(`Capacitor.isNativePlatform()`), which is what makes paywall-hiding robust for Google
review, and gives **native push (FCM)** that plugs into the growth/notification engine.
Chosen over a bare TWA (fragile app-context detection, web-push only).

- `appId: co.in.centumania.app`, `appName: CentuMania`
- `server.url → https://centumania.co.in` (native shell loads the live site; one web
  codebase stays the source of truth). Native plugins add app-mode + push.

## 3. Architecture

```
Android device
  └─ Capacitor native shell (co.in.centumania.app)
       ├─ WebView → https://centumania.co.in  (the live Next.js app)
       ├─ isNativeApp() = true  →  web hides ALL purchase surfaces
       └─ (Phase B) FCM push  →  device_tokens table  →  notify service (3rd channel)
```

- **`isNativeApp()`** — small client helper reading `Capacitor.isNativePlatform()`.
- Web components gate purchase UI on `isNativeApp()`.

## 4. App-mode paywall hiding (the compliance-critical piece)

When `isNativeApp()` is true, remove every purchase surface. Concrete targets found in code:

| Surface | File | In-app behavior |
|---|---|---|
| "Payment" nav item | `src/components/layout/AppLayout.tsx` | removed from nav |
| "Payment" nav item | `src/components/dashboard-v2/AppShell.tsx` | removed from nav |
| Classroom locked-topic CTA → `/payment` | `src/components/classroom/LessonView.tsx` | replaced with "Continue in browser" (no payment method named) |
| `/payment` page (UPI QR) | `src/app/payment/page.tsx` + `PaymentGate` | renders neutral "access not active" state |
| Pricing "Pay/Start" CTAs | landing pricing | hidden or → login (landing isn't shown in-app anyway; start_url = /dashboard → login) |

**Neutral unpaid state (in-app):** "Your access isn't active yet. We'll notify you the
moment it's ready." + generic support. No price, no UPI, no QR, no pay link. Payment
instructions reach students off-app (website / WhatsApp / email) — which the policy allows.

## 5. Account deletion (hard Play requirement — currently a GAP)

Google requires apps with account creation to offer self-serve deletion, both **in-app**
and via a **public web URL**. Today only an admin can delete a student
(`src/app/api/admin/students/[id]/route.ts`). Build:
- `/account/delete` — in-app screen (confirm → delete).
- `POST /api/account/delete` — auth'd; deletes the user + associated data.
- Public web URL (same route, reachable from the browser) for the Play listing's
  "data deletion" field.

## 6. Native push — Phase B (ties into growth engine)

Register FCM device token → new `device_tokens` table → push becomes a 3rd channel in
`src/lib/notify/service.ts` alongside WhatsApp/email. Daily-test reminders + at-risk
nudges as native push. Not in the first submission.

## 7. Build & release

`npm run build` → `npx cap sync` → Android Studio → **signed AAB** → Play Console →
**internal testing track first**, then production.

- Keystore generated locally; **founder stores it safely** (losing it = can never update).
- **Hard dependency:** the app wraps *production*, so the app-mode hiding + account
  deletion **must be deployed to prod before submission** — else a reviewer opening the
  app sees the live UPI paywall → rejection. Per the controlled-deploy rule, that prod
  deploy happens **only on the founder's explicit "deploy."**

## 8. Phasing

- **Phase A (store-ready MVP):** Capacitor shell + app-mode hiding + neutral unpaid
  state + account deletion + icons/splash + Play listing → internal testing.
- **Phase B (fast-follow):** native push wired to the growth engine (`device_tokens`).
- **Phase C (later):** offline study (service worker), deep links.

## 9. Costs (researched 2026-07-28)

- **Mandatory:** Google Play Console **$25 (~₹2,100), one-time, lifetime.** That's the
  only required cash cost.
- **₹0 recurring.** No yearly fee, no Google commission (consumption-only), FCM push free.
- Hosting/Supabase: no increase (app wraps existing site).
- Optional: designer store graphics ₹3–10k (else DIY free).

## 10. Open founder decisions (their side; do not block the build)

1. **Account type:** Organization (recommended — free D-U-N-S number, publish straight to
   production, no 12-tester gauntlet) vs Personal ($25, but 12 testers × 14 days first).
2. Whether the business already has a **D-U-N-S number**.

## 11. Compliance checklist

- [ ] App-mode paywall hiding (no purchase surface reachable in app)
- [ ] Self-serve account deletion (in-app + public URL)
- [ ] Data Safety form (declare: name, email, phone, usage)
- [ ] Content rating (Education / Everyone)
- [ ] Privacy Policy URL (`/privacy` — exists)
- [ ] Signed AAB + keystore stored safely by founder

---

Related work streams (undeployed, pending consolidation decision):
`feat/v2-metrics-complete` (phone dashboard + subscription landing), `feat/growth-engine`
(WhatsApp/email notification engine). Native push in Phase B connects to the latter.
