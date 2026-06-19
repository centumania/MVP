import { PublicPage } from '@/src/components/layout/PublicPage'

export default function RefundPage() {
  return (
    <PublicPage
      eyebrow="Legal"
      title="Refund Policy"
      lead="CentuMania offers a performance-linked refund guarantee. If you complete the programme and still don't improve, we return your money — no arguments."
    >
      <h2>Who Is Eligible</h2>
      <p>You qualify for a full refund if you meet <strong>all four</strong> of the following conditions:</p>
      <ul>
        <li>Attempted <strong>every daily exam</strong> in the batch without missing a single day</li>
        <li>Maintained an <strong>average score below 50%</strong> across all exams</li>
        <li>Submitted the refund request <strong>within 7 days</strong> of the final exam day</li>
        <li>Completed all exam sessions for each programme day</li>
      </ul>

      <h2>How to Request a Refund</h2>
      <p>
        Message us on WhatsApp at{' '}
        <a href="https://wa.me/917200132957" target="_blank" rel="noopener noreferrer" style={{ color: '#22C55E', fontWeight: 600 }}>
          +91 72001 32957
        </a>{' '}
        within 7 days of the batch end date. Include your registered email address or registration number.
        We will verify your eligibility automatically from your submission data — no documents required.
      </p>

      <h2>How Eligibility Is Verified</h2>
      <p>
        Eligibility is checked against your exam submission records stored on the platform. Specifically:
      </p>
      <ul>
        <li>Attendance is verified by checking that a submission exists for every scheduled exam day</li>
        <li>Average score is calculated across all valid submissions</li>
        <li>The request timestamp is compared against the batch end date</li>
      </ul>
      <p>
        There is no manual review or negotiation. If the data shows you are eligible, the refund is approved.
        If it shows you are not, it is declined. This keeps the process fair and fast.
      </p>

      <h2>Refund Processing</h2>
      <p>
        Approved refunds are processed within <strong>7 business days</strong> to the original payment method
        (the UPI ID used at the time of payment). We will confirm processing via WhatsApp.
      </p>

      <h2>What Is Not Covered</h2>
      <ul>
        <li>Refunds for dissatisfaction without meeting the eligibility criteria</li>
        <li>Refunds for missed exams due to personal reasons</li>
        <li>Refunds for accounts terminated due to Terms of Service violations</li>
        <li>Refunds for second or repeat enrolments</li>
        <li>Partial refunds for partial programme completion</li>
      </ul>

      <h2>Why This Policy Exists</h2>
      <p>
        This guarantee exists because we are confident in the programme. If you show up every day and
        still don&apos;t improve, we don&apos;t deserve your money. But the key word is &ldquo;show up&rdquo;
        — the refund is only available to students who actually completed the programme fully.
      </p>

      <h2>Contact</h2>
      <p>
        For refund requests or questions about eligibility, message us on WhatsApp:{' '}
        <a href="https://wa.me/917200132957" target="_blank" rel="noopener noreferrer" style={{ color: '#22C55E', fontWeight: 600 }}>
          +91 72001 32957
        </a>
      </p>
    </PublicPage>
  )
}
