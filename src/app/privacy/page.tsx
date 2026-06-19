import { PublicPage } from '@/src/components/layout/PublicPage'

export default function PrivacyPage() {
  return (
    <PublicPage
      eyebrow="Legal"
      title="Privacy Policy"
      lead="This policy describes how CentuMania collects, uses, and protects your personal data. Last updated: June 2026."
    >
      <h2>1. Who We Are</h2>
      <p>
        CentuMania is an online exam preparation platform for government competitive examinations,
        operated by its founders (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). This policy
        is written in accordance with India&apos;s Digital Personal Data Protection Act, 2023 (DPDP Act).
      </p>

      <h2>2. Data We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> Full name, email address, mobile number, and password (stored hashed).</li>
        <li><strong>Performance data:</strong> Exam answers submitted, scores, and submission timestamps.</li>
        <li><strong>Payment data:</strong> Payment verification status only. We do not store card or UPI details — those are handled directly by your UPI app.</li>
        <li><strong>Usage data:</strong> Pages visited, login timestamps, and IP address for security purposes.</li>
        <li><strong>AI-generated data:</strong> Your performance data is sent to Anthropic&apos;s API to generate personalised coaching reports. No data is retained by Anthropic beyond the API call.</li>
      </ul>

      <h2>3. How We Use Your Data</h2>
      <ul>
        <li>To provide the exam preparation service and track your progress</li>
        <li>To verify your payment and grant access to the programme</li>
        <li>To generate personalised AI Mentor reports after each exam</li>
        <li>To display batch leaderboards to enrolled students</li>
        <li>To contact you about your account or batch updates</li>
      </ul>
      <p>We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>

      <h2>4. Data Retention</h2>
      <p>
        We retain your account and performance data for the duration of your enrolment plus 12 months
        (for refund verification purposes). After this period, data is deleted or anonymised.
        You may request earlier deletion — see Section 6.
      </p>

      <h2>5. Data Security</h2>
      <p>
        Passwords are stored using industry-standard hashing. All data is transmitted over HTTPS.
        Access to your personal data is restricted to authorised administrators. Your exam answers
        are stored server-side; correct answers are never sent to your browser before you submit.
      </p>

      <h2>6. Your Rights</h2>
      <p>Under the DPDP Act, you have the right to:</p>
      <ul>
        <li><strong>Access</strong> the personal data we hold about you</li>
        <li><strong>Correct</strong> inaccurate data</li>
        <li><strong>Erase</strong> your account and associated data</li>
        <li><strong>Withdraw consent</strong> at any time (which means closing your account)</li>
      </ul>
      <p>
        To exercise these rights, contact us on WhatsApp:{' '}
        <a href="https://wa.me/917200132957" target="_blank" rel="noopener noreferrer" style={{ color: '#22C55E', fontWeight: 600 }}>
          +91 72001 32957
        </a>
        . We will respond within 30 days.
      </p>

      <h2>7. Cookies</h2>
      <p>
        We use session cookies to keep you logged in. We do not use advertising or tracking cookies,
        and we do not use Google Analytics or similar third-party analytics tools.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this policy. When we do, we will update the &ldquo;Last updated&rdquo; date
        above and notify enrolled students via their registered contact.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about this policy? Reach us on WhatsApp:{' '}
        <a href="https://wa.me/917200132957" target="_blank" rel="noopener noreferrer" style={{ color: '#22C55E', fontWeight: 600 }}>
          +91 72001 32957
        </a>
      </p>
    </PublicPage>
  )
}
