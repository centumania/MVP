import { PublicPage } from '@/src/components/layout/PublicPage'

export default function AboutPage() {
  return (
    <PublicPage
      eyebrow="Who we are"
      title="About CentuMania"
      lead="CentuMania is a structured daily exam platform built for serious government exam aspirants. We believe that discipline — not talent — is what separates toppers from the rest."
    >
      <h2>Our Mission</h2>
      <p>
        Most aspirants fail not because they lack knowledge, but because they lack a system. Scattered preparation, no daily accountability, and no honest benchmark leaves them guessing right up to exam day.
      </p>
      <p>
        CentuMania was built to fix exactly that. A timed exam every morning at 6 AM. A live leaderboard that makes your rank — and your discipline — public. An AI Mentor that tells you what to fix after every attempt.
      </p>

      <h2>How It Works</h2>
      <p>
        Every registered student gets access to a daily timed exam that opens at 6:00 AM and closes at 8:30 AM IST. The exam auto-submits at the deadline. After submission, the full answer key is released and your rank on the batch leaderboard updates in real time.
      </p>
      <p>
        The platform tracks accuracy across subjects, streaks, score trends, and the Centum Index — a composite measure of attendance and performance. Everything is designed to give you an honest picture of where you stand.
      </p>

      <h2>The Refund Guarantee</h2>
      <p>
        We back the programme with a performance-linked refund. If you attend every exam and still score below 50% on average, we return your money — no arguments, no hassle. That&apos;s how confident we are in what daily discipline does to exam scores.
      </p>

      <h2>Contact Us</h2>
      <p>
        For any questions, reach us on WhatsApp:{' '}
        <a href="https://wa.me/917200132957" target="_blank" rel="noopener noreferrer" style={{ color: '#22C55E', fontWeight: 600 }}>
          +91 72001 32957
        </a>
        . We typically respond within a few hours.
      </p>
    </PublicPage>
  )
}
