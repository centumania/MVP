import { PublicPage } from '@/src/components/layout/PublicPage'

export default function ContactPage() {
  return (
    <PublicPage
      eyebrow="Get in touch"
      title="Contact Us"
      lead="The fastest way to reach us is WhatsApp. We respond to all messages within a few hours during working hours."
    >
      <div style={{
        background: '#111827',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '32px',
        marginBottom: 32,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 20,
      }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#6B7280', marginBottom: 6 }}>WhatsApp</p>
          <a
            href="https://wa.me/917200132957"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: '#22C55E', color: '#fff', fontWeight: 700,
              padding: '12px 24px', borderRadius: 10, fontSize: 15,
              textDecoration: 'none',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chat on WhatsApp
          </a>
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 10 }}>+91 72001 32957 · Available Mon–Sat, 9 AM – 8 PM IST</p>
        </div>
      </div>

      <h2>What can we help with?</h2>
      <ul>
        <li>Payment confirmation and access activation</li>
        <li>Questions about the exam schedule or batch dates</li>
        <li>Technical issues with the platform</li>
        <li>Refund requests and eligibility queries</li>
        <li>Any other questions before you join</li>
      </ul>

      <h2>Response Time</h2>
      <p>
        We aim to respond to all WhatsApp messages within 2–4 hours during working hours (Mon–Sat, 9 AM–8 PM IST). Payment verifications are typically processed within a few hours of receiving payment.
      </p>
    </PublicPage>
  )
}
