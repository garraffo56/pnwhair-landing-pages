import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | PNW Hair Restoration',
  robots: 'noindex, nofollow',
}

const NAVY = '#04435D'
const MIST = '#F4F6FA'

const SECTIONS = [
  {
    heading: '1. PROGRAM DESCRIPTION',
    body: 'PNW Hair Restoration operates an SMS messaging program that allows patients and prospective patients to receive text messages related to our services. Participation requires opt-in consent. Message frequency varies.',
  },
  {
    heading: '2. MESSAGING USE CASES',
    body: 'Messages sent through this program may include: Appointment & Service Alerts, Customer Support, Practice Updates, and Promotional Messaging.',
  },
  {
    heading: '3. CONSENT IS NOT A CONDITION OF SERVICE',
    body: 'You are not required to consent to receive SMS messages as a condition of receiving medical care, consultations, or any services from PNW Hair Restoration.',
  },
  {
    heading: '4. MESSAGE & DATA RATES',
    body: 'Standard message and data rates may apply depending on your mobile carrier and plan.',
  },
  {
    heading: '5. NO SHARING OF SMS OPT-IN INFORMATION',
    body: 'We do not sell, rent, share, or transfer your SMS opt-in information or phone number to any third parties for their own marketing purposes.',
  },
  {
    heading: '6. HOW TO OPT OUT',
    body: 'To stop receiving SMS messages, reply STOP, CANCEL, UNSUBSCRIBE, END, or QUIT to any message. You may also opt out by contacting us at (503) 782-5749 or info@pnwhairrestoration.com, or by using the form on our website. Opt-out requests are processed within 10 business days.',
  },
  {
    heading: '7. HOW TO GET HELP',
    body: 'For assistance, reply HELP to any message, or contact us directly:\n9735 SW Shady Ln, Suite 200\nTigard, OR 97223\n(503) 782-5749\ninfo@pnwhairrestoration.com',
  },
  {
    heading: '8. AGE REQUIREMENT',
    body: 'You must be at least 18 years of age to participate in this SMS messaging program.',
  },
  {
    heading: '9. CARRIER DISCLAIMER',
    body: 'Carriers are not liable for delayed or undelivered messages.',
  },
  {
    heading: '10. HIPAA & HEALTH INFORMATION',
    body: 'PNW Hair Restoration is a HIPAA-covered entity. We do not transmit protected health information (PHI) via unsecured SMS. SMS communications are limited to scheduling, general inquiries, and non-clinical information.',
  },
  {
    heading: '11. PRIVACY',
    body: 'Your use of our SMS program is also subject to our Privacy Policy, available at /privacy-policy.',
  },
  {
    heading: '12. CHANGES TO THESE TERMS',
    body: 'We may update these Terms of Service from time to time. The revised version will be effective as soon as it is posted with an updated date. Continued use of the SMS program after changes constitutes acceptance of the revised terms.',
  },
  {
    heading: '13. GOVERNING LAW',
    body: 'These Terms are governed by the laws of the State of Oregon. Any disputes shall be resolved in the courts of Tigard, Oregon.',
  },
  {
    heading: '14. CONTACT US',
    body: '9735 SW Shady Ln, Suite 200\nTigard, OR 97223\n(503) 782-5749\ninfo@pnwhairrestoration.com',
  },
]

export default function Page() {
  return (
    <div style={{ fontFamily: "'Roboto', sans-serif", color: '#333', background: '#fff' }}>
      <header style={{ background: '#fff', padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e8ebf2' }}>
        <a href="/"><img src="/images/pnw-logo.png" alt="PNW Hair Restoration" style={{ height: 44, width: 'auto' }} /></a>
        <a href="tel:+15037825749" style={{ border: `2px solid ${NAVY}`, color: NAVY, fontWeight: 700, fontSize: 15, borderRadius: 999, padding: '10px 20px', textDecoration: 'none' }}>(503) 782-5749</a>
      </header>
      <div style={{ background: MIST, padding: '48px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Rubik', sans-serif", fontWeight: 600, fontSize: 36, color: '#000', textTransform: 'uppercase' }}>Terms of Service</h1>
        <p style={{ fontSize: 14, color: '#5a6272', marginTop: 8 }}>SMS Messaging Program &nbsp;&mdash;&nbsp; Last Updated: 6/24/2026</p>
      </div>
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px 64px' }}>
        <p style={{ fontSize: 15, lineHeight: 1.65, margin: '0 0 32px', color: '#555' }}>
          These Terms of Service govern PNW Hair Restoration&apos;s SMS messaging program. By opting in to receive text messages from us, you agree to these terms.
        </p>
        {SECTIONS.map(({ heading, body }) => (
          <section key={heading} style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: "'Rubik', sans-serif", fontWeight: 600, fontSize: 15, color: NAVY, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {heading}
            </h2>
            {body.split('\n').map((line, i) => (
              <p key={i} style={{ fontSize: 15, lineHeight: 1.65, margin: '4px 0', color: '#444' }}>{line}</p>
            ))}
          </section>
        ))}
      </main>
      <footer style={{ background: MIST, padding: '22px 24px', textAlign: 'center', fontSize: 13, color: '#5a6272' }}>
        &copy; 2026 PNW Hair Restoration &nbsp;&middot;&nbsp;
        <a href="/privacy-policy" style={{ color: '#333' }}>Privacy Policy</a> &nbsp;&middot;&nbsp;
        <a href="/cookie-policy" style={{ color: '#333' }}>Cookie Policy</a> &nbsp;&middot;&nbsp;
        <a href="/terms-of-service" style={{ color: '#333' }}>Terms of Service</a>
      </footer>
    </div>
  )
}
