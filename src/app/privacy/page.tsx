import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — CentuMania',
  description: 'How CentuMania collects, uses, and protects your personal data.',
  robots: { index: true, follow: false },
}

const LAST_UPDATED = '11 June 2026'
const CONTACT_EMAIL = 'support@centumania.in'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <div className="max-w-2xl mx-auto px-6 py-12">

        <Link href="/"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors font-mono mb-10">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to home
        </Link>

        <h1 className="text-3xl font-bold text-text tracking-tight mb-2"
          style={{ fontFamily: 'var(--font-fraunces,serif)' }}>
          Privacy Policy
        </h1>
        <p className="text-xs text-text-muted font-mono mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-8 text-sm text-text-muted leading-relaxed">

          <section>
            <h2 className="text-base font-bold text-text mb-3">1. Who we are</h2>
            <p>
              CentuMania is an online exam preparation platform for Puducherry LDC/UDC competitive examinations,
              operated by its founders (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;).
              This policy describes how we collect and use your personal data in accordance with India&apos;s
              Digital Personal Data Protection Act, 2023 (DPDP Act).
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text mb-3">2. Data we collect</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li><strong className="text-text-secondary">Account data:</strong> Full name, email address, mobile number, and password (stored hashed).</li>
              <li><strong className="text-text-secondary">Performance data:</strong> Exam answers submitted, scores, submission timestamps.</li>
              <li><strong className="text-text-secondary">Payment data:</strong> Payment verification status (we do not store card or UPI details — these are handled by our payment processor).</li>
              <li><strong className="text-text-secondary">Usage data:</strong> Pages visited, login timestamps, IP address.</li>
              <li><strong className="text-text-secondary">AI-generated data:</strong> Your performance data is sent to Anthropic&apos;s API to generate personalised coaching reports. No data is retained by Anthropic beyond the API call.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-text mb-3">3. How we use your data</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>To provide the exam preparation service and track your progress.</li>
              <li>To verify your payment and grant access to premium content.</li>
              <li>To generate personalised AI mentor reports after each exam.</li>
              <li>To display leaderboards to enrolled students.</li>
              <li>To contact you about your account or cohort updates.</li>
            </ul>
            <p className="mt-3">
              We do not sell, rent, or share your personal data with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text mb-3">4. Data retention</h2>
            <p>
              We retain your account and performance data for the duration of your enrollment plus 12 months.
              After this period, data is deleted or anonymised. You may request earlier deletion (see Section 6).
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text mb-3">5. Data security</h2>
            <p>
              Passwords are stored using industry-standard hashing. All data is transmitted over HTTPS.
              Access to your personal data is restricted to authorised administrators.
              Your exam answers are stored server-side; correct answers are never sent to your browser.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text mb-3">6. Your rights</h2>
            <p>Under the DPDP Act, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li><strong className="text-text-secondary">Access</strong> the personal data we hold about you.</li>
              <li><strong className="text-text-secondary">Correct</strong> inaccurate data.</li>
              <li><strong className="text-text-secondary">Erase</strong> your account and associated data.</li>
              <li><strong className="text-text-secondary">Withdraw consent</strong> at any time (which means closing your account).</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, email us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:text-primary-hover">
                {CONTACT_EMAIL}
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text mb-3">7. Cookies</h2>
            <p>
              We use session cookies to keep you logged in. We do not use advertising or tracking cookies.
              We do not use Google Analytics or similar third-party analytics.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text mb-3">8. Changes to this policy</h2>
            <p>
              We may update this policy. When we do, we will update the &ldquo;Last updated&rdquo; date above
              and notify enrolled students by email.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-text mb-3">9. Contact</h2>
            <p>
              Questions about this policy?{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:text-primary-hover">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <Link href="/" className="text-xs text-text-muted hover:text-text-secondary transition-colors font-mono">
            ← Back to CentuMania
          </Link>
        </div>
      </div>
    </div>
  )
}
