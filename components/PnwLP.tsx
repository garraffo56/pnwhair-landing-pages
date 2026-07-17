'use client'
import { Suspense } from 'react'
import GhlForm from './GhlForm'
import GclidCapture from './GclidCapture'

// ── DESIGN TOKENS (from live start.pnwhairrestoration.com capture 2026-07-17) ──
const TEAL  = '#04435D'
const CREAM = '#F7E6CA'
const INK   = '#000000'
const TEXT  = '#333333'
const GREY  = '#F7F7F7'
const MIST  = '#F2F2F2'
const WHITE = '#ffffff'
const GOLD  = '#f0b429'

const H_FONT = "'Lato', sans-serif"
const B_FONT = "'Roboto', sans-serif"

const PHONE_DISPLAY = '(503) 782-5749'
const PHONE_TEL = '+15037825749'

function CtaButton({ label, dark = true, href = '#consult-form' }: { label: string; dark?: boolean; href?: string }) {
  return (
    <a href={href} style={{
      display: 'inline-block', background: dark ? TEAL : CREAM, color: dark ? WHITE : INK,
      fontFamily: B_FONT, fontWeight: 700, fontSize: 15, letterSpacing: '0.4px', textTransform: 'uppercase',
      padding: '15px 30px', borderRadius: 62, textDecoration: 'none',
    }}>{label}</a>
  )
}

function Stars() {
  return (
    <div style={{ display: 'flex', gap: 3 }} aria-label="5 star rating">
      {[0,1,2,3,4].map(i => (
        <svg key={i} width="17" height="17" viewBox="0 0 20 20" fill={GOLD} aria-hidden="true">
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  )
}

function Circle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: 96, height: 96, borderRadius: '50%', background: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{children}</div>
  )
}

const ic = { width: 44, height: 44, viewBox: '0 0 24 24', fill: 'none' as const, stroke: '#fff', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const CalendarGlyph = () => (<svg {...ic} aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /><path d="M9 15l2 2 4-4" /></svg>)
const PatientGlyph = () => (<svg {...ic} aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-3.9 3.6-7 8-7s8 3.1 8 7" /><path d="M15.5 11.5l1.5 1.5 3-3" /></svg>)
const DoctorGlyph = () => (<svg {...ic} aria-hidden="true"><circle cx="12" cy="7" r="4" /><path d="M5 21v-2a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v2" /><path d="M12 13v4M10 15h4" /></svg>)
const PlanGlyph = () => (<svg {...ic} aria-hidden="true"><path d="M9 3h6v4H9z" /><path d="M5 7h14v14H5z" /><path d="M9 13h6M9 17h4" /></svg>)

export interface PnwLPProps {
  heroFormId: string
  bottomFormId: string
  h1?: string
  heroSub?: string
}

export default function PnwLP({
  heroFormId,
  bottomFormId,
  h1 = 'MEDICAL EVALUATION FOR THINNING HAIR & HAIR LOSS CONDITIONS',
  heroSub = 'Discover what causes hair loss and learn which treatment options fit each patient’s goals and hair biology.',
}: PnwLPProps) {
  return (
    <main style={{ fontFamily: B_FONT, color: TEXT, background: WHITE }}>
      <Suspense fallback={null}><GclidCapture /></Suspense>

      {/* NAV */}
      <nav className="pnw-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', background: WHITE, borderBottom: '1px solid #e8ecef' }}>
        <img src="/images/pnw-logo.png" alt="PNW Hair Restoration" className="pnw-nav-logo" style={{ height: 48, width: 'auto' }} />
        <div className="pnw-nav-btns" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <a href="#consult-form" className="pnw-nav-btn" style={{ background: CREAM, color: INK, fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.4px', padding: '12px 22px', borderRadius: 62, textDecoration: 'none' }}>Request Your Consultation</a>
          <a href={`tel:${PHONE_TEL}`} className="pnw-nav-btn" style={{ border: `2px solid ${TEAL}`, color: TEAL, fontWeight: 700, fontSize: 14, padding: '10px 20px', borderRadius: 62, textDecoration: 'none' }}>{PHONE_DISPLAY}</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: MIST }}>
        <div className="pnw-hero-grid pnw-pad" style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 44, alignItems: 'stretch', maxWidth: 1200, margin: '0 auto', padding: '44px 48px 52px' }}>
          <div>
            <h1 className="pnw-hero-h1" style={{ fontFamily: H_FONT, fontWeight: 700, fontSize: 40, lineHeight: 1.16, color: INK, textTransform: 'uppercase', maxWidth: 560 }}>{h1}</h1>
            <p style={{ marginTop: 16, fontSize: 17, lineHeight: 1.55, maxWidth: 520 }}>{heroSub}</p>
            <p style={{ marginTop: 10, fontSize: 16, lineHeight: 1.55, maxWidth: 520 }}>
              Request a consultation to understand hair loss and explore the available options.
            </p>
            <div className="pnw-hero-photo" style={{ position: 'relative', marginTop: 26, borderRadius: 12, overflow: 'hidden', minHeight: 330 }}>
              <img src="/images/hero-clinic.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
              <div className="pnw-hero-trust" style={{ position: 'absolute', right: 16, bottom: 16, background: WHITE, borderRadius: 10, boxShadow: '0 8px 26px rgba(4,30,45,0.18)', padding: '14px 16px', maxWidth: 280 }}>
                <Stars />
                <div style={{ fontFamily: H_FONT, fontWeight: 700, fontSize: 13.5, color: INK, marginTop: 8, textTransform: 'uppercase' }}>Patient-Centered Care</div>
                <div style={{ fontSize: 13, lineHeight: 1.45, marginTop: 4 }}>Patients appreciate our personalized, doctor-led approach.</div>
              </div>
            </div>
          </div>
          <div id="consult-form" style={{ background: WHITE, borderRadius: 12, boxShadow: '0 10px 34px rgba(4,30,45,0.10)', padding: '26px 24px', alignSelf: 'start' }}>
            <h2 style={{ fontFamily: B_FONT, fontWeight: 700, fontSize: 20, color: INK, textTransform: 'uppercase', textAlign: 'center', marginBottom: 14 }}>Request Your Hair Consultation</h2>
            <GhlForm formId={heroFormId} height={400} formName="Request Your Hair Consultation - PNW" />
          </div>
        </div>
      </section>

      {/* PATIENT-CENTERED CARE (teal band) */}
      <section style={{ background: TEAL, padding: '54px 24px', textAlign: 'center' }}>
        <h2 className="pnw-h2" style={{ fontFamily: H_FONT, fontWeight: 700, fontSize: 26, color: WHITE, textTransform: 'uppercase' }}>Patient-Centered Care</h2>
        <p style={{ marginTop: 8, fontSize: 16, color: WHITE, opacity: 0.9 }}>Patients appreciate our personalized, doctor-led approach.</p>
        <img src="/images/reviews-strip.png" alt="Patient review ratings" style={{ margin: '18px auto 0', height: 48, width: 'auto' }} />
      </section>

      {/* STEPS */}
      <section style={{ background: GREY }}>
        <div className="pnw-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '58px 48px 64px', textAlign: 'center' }}>
          <h2 className="pnw-h2" style={{ fontFamily: H_FONT, fontWeight: 700, fontSize: 30, color: INK, textTransform: 'uppercase' }}>A Personalized Hair Loss Plan Is Just Three Steps Away</h2>
          <p style={{ marginTop: 10, fontSize: 17 }}>It&rsquo;s simpler than you think, and it all starts with a conversation.</p>
          <div className="pnw-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28, marginTop: 40 }}>
            {[
              { t: 'SCHEDULE YOUR EVALUATION', d: 'Pick a time that works best for you.', icon: <CalendarGlyph /> },
              { t: 'SHARE YOUR GOALS', d: 'Tell us what you want to improve.', icon: <PatientGlyph /> },
              { t: 'HAIR LOSS ASSESSMENT', d: 'A provider examines thinning patterns.', icon: <DoctorGlyph /> },
              { t: 'PERSONALIZED TREATMENT PLAN', d: 'Get a plan tailored to your needs.', icon: <PlanGlyph /> },
            ].map(s => (
              <div key={s.t} style={{ background: WHITE, borderRadius: 12, padding: '26px 18px', boxShadow: '0 4px 18px rgba(4,30,45,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}><Circle>{s.icon}</Circle></div>
                <div style={{ fontFamily: H_FONT, fontWeight: 700, fontSize: 15, color: INK, textTransform: 'uppercase', marginTop: 16 }}>{s.t}</div>
                <div style={{ fontSize: 14, lineHeight: 1.5, marginTop: 8 }}>{s.d}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 44 }}>
            <div style={{ fontFamily: H_FONT, fontWeight: 700, fontSize: 20, color: INK, textTransform: 'uppercase' }}>No Pressure. No Obligation. Just Honest Answers About Your Options.</div>
            <p style={{ marginTop: 8, fontSize: 16 }}>You&rsquo;re in the right place.</p>
            <div style={{ marginTop: 18 }}><CtaButton label="Request Your Evaluation" /></div>
            <p style={{ marginTop: 10, fontSize: 13.5, color: '#5a6272' }}>Fast. Private. No obligation.</p>
          </div>
        </div>
      </section>

      {/* DR. HIGGINS */}
      <section className="pnw-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '58px 48px' }}>
        <h2 className="pnw-h2" style={{ fontFamily: H_FONT, fontWeight: 700, fontSize: 30, color: INK, textTransform: 'uppercase' }}>Dr. Higgins: Specialist in Hair Loss Evaluation &amp; Treatment Planning</h2>
        <div style={{ fontFamily: H_FONT, fontWeight: 700, fontSize: 13, color: TEAL, textTransform: 'uppercase', marginTop: 10 }}>Verified patient experiences from real consultations and care.</div>
        <p style={{ marginTop: 14, fontSize: 15.5, lineHeight: 1.65, maxWidth: 780 }}>
          Dr. Andy Higgins is a board-certified physician with more than 20 years of clinical experience. His medical background includes extensive experience in patient care, clinical evaluation, and physician oversight across a range of medical settings.
        </p>
        <p style={{ marginTop: 12, fontSize: 15.5, lineHeight: 1.65, maxWidth: 780 }}>
          In recent years, Dr. Higgins transitioned his clinical focus to the medical evaluation and management of hair loss conditions, including alopecia. His practice emphasizes individualized assessment, patient education, informed decision-making, and medically appropriate planning related to hair loss concerns.
        </p>
        <p style={{ marginTop: 12, fontSize: 15.5, lineHeight: 1.65, maxWidth: 780 }}>
          Dr. Higgins provides hair loss&ndash;related medical care within the scope of his training and licensure and maintains direct physician involvement throughout the care process.
        </p>
        <p style={{ marginTop: 12, fontSize: 15.5, lineHeight: 1.65, maxWidth: 780 }}>
          He practices in accordance with applicable medical regulations, professional standards, and ethical guidelines related to hair loss evaluation and non-surgical management, delivering care in a regulated clinical setting.
        </p>
        <div style={{ marginTop: 20 }}><CtaButton label="Request Your Evaluation" /></div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: MIST }}>
        <div className="pnw-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '58px 48px', textAlign: 'center' }}>
          <h2 className="pnw-h2" style={{ fontFamily: H_FONT, fontWeight: 700, fontSize: 28, color: INK, textTransform: 'uppercase' }}>Real Patients. Real Experiences.</h2>
          <p style={{ marginTop: 8, fontSize: 16 }}>Verified patient experiences shared after their visit.</p>
          <div className="pnw-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 22, marginTop: 32, textAlign: 'left' }}>
            {[
              { q: '“From the moment I walked in, I felt welcomed and cared for. The clinic atmosphere was calm and professional. Dr. Higgins took the time to listen to my concerns and answer my questions thoroughly. I appreciated the thoughtful, patient-centered approach.”', n: 'Ricardo B.' },
              { q: '“Dr. Higgins is an excellent doctor. I highly recommend him for his professionalism, knowledge, and patient care.”', n: 'Max M.' },
              { q: '“Dr. Higgins and his team are professional, attentive, and informative. They made sure I understood each step and felt comfortable throughout my visits. The staff was supportive, and communication was clear and reassuring.”', n: 'M.B.' },
            ].map(t => (
              <div key={t.n} style={{ background: WHITE, borderRadius: 12, padding: '24px 22px', boxShadow: '0 4px 18px rgba(4,30,45,0.06)' }}>
                <Stars />
                <p style={{ fontSize: 14.5, lineHeight: 1.65, marginTop: 12 }}>{t.q}</p>
                <div style={{ fontFamily: H_FONT, fontWeight: 700, fontSize: 14, color: INK, marginTop: 12 }}>{t.n}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINANCING */}
      <section style={{ background: GREY }}>
        <div className="pnw-fin-grid pnw-pad" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 44, alignItems: 'center', maxWidth: 1100, margin: '0 auto', padding: '58px 48px' }}>
          <div>
            <h2 className="pnw-h2" style={{ fontFamily: H_FONT, fontWeight: 700, fontSize: 28, color: INK, textTransform: 'uppercase' }}>Getting Help for Hair Loss Can Be More Affordable Than You Think</h2>
            <p style={{ marginTop: 10, fontSize: 16 }}>Flexible monthly plans built for real patients.</p>
            <div style={{ marginTop: 22, fontSize: 15 }}>As low as</div>
            <div style={{ fontFamily: H_FONT, fontWeight: 700, fontSize: 44, color: TEAL }}>$188/MO</div>
            <div style={{ borderTop: `2px solid ${TEAL}`, maxWidth: 320, margin: '14px 0' }} />
            <div style={{ fontFamily: H_FONT, fontWeight: 700, fontSize: 16, color: INK, textTransform: 'uppercase' }}>Fast, Simple Payment Plans</div>
            <p style={{ marginTop: 10, fontSize: 12.5, lineHeight: 1.5, color: '#5a6272', maxWidth: 520 }}>
              The above payment was calculated at 21.90% APR over 60 months. This purchase would have a total cost of $11,453. A down payment in the amount of monthly payment amount is due at the time of purchase. Payment amount rounded up to nearest whole number. 0% APR and other promotional rates subject to eligibility.
            </p>
            <div style={{ marginTop: 20 }}><CtaButton label="Request Your Evaluation" /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img src="/images/hero-clinic.png" alt="" style={{ borderRadius: 12, width: '100%', maxWidth: 440, height: 'auto', objectFit: 'cover' }} />
          </div>
        </div>
      </section>

      {/* BOTTOM FORM */}
      <section className="pnw-pad" style={{ maxWidth: 760, margin: '0 auto', padding: '58px 48px 66px', textAlign: 'center' }}>
        <h2 className="pnw-h2" style={{ fontFamily: H_FONT, fontWeight: 700, fontSize: 28, color: INK, textTransform: 'uppercase' }}>Why Patients Feel Confident Choosing Our Team</h2>
        <p style={{ marginTop: 8, fontSize: 16 }}>Real capabilities. Real safety. Real patient-first care.</p>
        <div style={{ background: WHITE, borderRadius: 12, boxShadow: '0 10px 34px rgba(4,30,45,0.10)', padding: '26px 24px', marginTop: 28, textAlign: 'left' }}>
          <h3 style={{ fontFamily: B_FONT, fontWeight: 700, fontSize: 19, color: INK, textTransform: 'uppercase', textAlign: 'center', marginBottom: 14 }}>Request Your Hair Consultation</h3>
          <GhlForm formId={bottomFormId} height={496} formName="Footer Form - PNW" />
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: MIST }}>
        <div className="pnw-footer-row pnw-pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1100, margin: '0 auto', padding: '26px 48px', gap: 24 }}>
          <img src="/images/pnw-logo.png" alt="PNW Hair Restoration" style={{ height: 38, width: 'auto' }} />
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href={`tel:${PHONE_TEL}`} style={{ color: TEAL, fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>{PHONE_DISPLAY}</a>
            <a href="/privacy-policy" style={{ color: TEXT, textDecoration: 'none', fontSize: 13 }}>Privacy Policy</a>
            <a href="/cookie-policy" style={{ color: TEXT, textDecoration: 'none', fontSize: 13 }}>Cookie Policy</a>
          </div>
          <div style={{ fontSize: 12.5, color: '#5a6272' }}>&copy; 2026 PNW Hair Restoration</div>
        </div>
      </footer>
    </main>
  )
}
