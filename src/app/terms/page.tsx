import { PublicPage } from '@/src/components/layout/PublicPage'

export default function TermsPage() {
  return (
    <PublicPage
      eyebrow="Legal"
      title="Terms & Conditions"
      lead="By registering and using CentuMania, you agree to these terms. Please read them carefully. Last updated: June 2026."
    >
      <h2>1. Acceptance of Terms</h2>
      <p>
        By creating an account or accessing any part of the CentuMania platform, you agree to be bound
        by these Terms and Conditions. If you do not agree, do not use the platform.
      </p>

      <h2>2. The Programme</h2>
      <p>
        CentuMania provides a structured exam preparation programme consisting of daily timed exams,
        leaderboards, performance analytics, and AI-generated coaching reports. The programme runs in
        fixed batches of set duration. Once a batch begins, its structure and schedule cannot be altered.
      </p>

      <h2>3. Registration & Payment</h2>
      <ul>
        <li>You must provide accurate information at registration.</li>
        <li>Access to the full programme requires payment of the applicable fee before Day 2 of the batch.</li>
        <li>Payment is accepted via UPI. Access is activated after manual verification by our team, typically within a few hours.</li>
        <li>Day 1 of each batch is available as a free preview to all registered users.</li>
        <li>You may not share your account credentials with anyone. Each account is for a single individual.</li>
      </ul>

      <h2>4. Exam Rules</h2>
      <ul>
        <li>Each daily exam opens at 6:00 AM IST and closes at 8:30 AM IST. This window is fixed and cannot be extended.</li>
        <li>The exam auto-submits when the window closes or when the time limit expires, whichever comes first.</li>
        <li>Missed exams cannot be retaken. Each missed day is recorded as a missed attempt.</li>
        <li>Any attempt to manipulate scores, share exam questions publicly, or access exam content through unauthorised means will result in immediate account termination without refund.</li>
      </ul>

      <h2>5. Leaderboard</h2>
      <p>
        Your name and rank are visible to other students within the same batch. This is an intentional
        feature of the platform. By enrolling, you consent to this visibility. Leaderboard data resets
        between batches.
      </p>

      <h2>6. Refund Policy</h2>
      <p>
        A performance-linked refund is available under specific conditions. Please refer to our{' '}
        <a href="/refund" style={{ color: '#2533FF', fontWeight: 600 }}>Refund Policy</a> for full details.
        Refunds are not available on the basis of dissatisfaction alone; they are tied to completion and
        performance criteria.
      </p>

      <h2>7. Intellectual Property</h2>
      <p>
        All exam questions, study materials, and platform content are the intellectual property of CentuMania.
        You may not reproduce, distribute, or share any exam content, questions, or answers in any form,
        publicly or privately, during or after the programme.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        CentuMania is not liable for failure to clear any competitive examination. The platform provides
        preparation tools and structured practice; actual exam outcomes depend on many factors beyond
        our control. Our liability is limited to the amount you paid for the programme.
      </p>

      <h2>9. Account Termination</h2>
      <p>
        We reserve the right to terminate any account that violates these terms, engages in cheating or
        unfair practices, or misuses the platform. Terminated accounts are not eligible for a refund.
      </p>

      <h2>10. Governing Law</h2>
      <p>
        These terms are governed by the laws of India. Any disputes will be subject to the jurisdiction
        of courts in Puducherry, India.
      </p>

      <h2>11. Changes to These Terms</h2>
      <p>
        We may update these terms. Continued use of the platform after changes are posted constitutes
        acceptance of the updated terms. Enrolled students will be notified of material changes.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these terms? Reach us on WhatsApp:{' '}
        <a href="https://wa.me/917200132957" target="_blank" rel="noopener noreferrer" style={{ color: '#22C55E', fontWeight: 600 }}>
          +91 72001 32957
        </a>
      </p>
    </PublicPage>
  )
}
