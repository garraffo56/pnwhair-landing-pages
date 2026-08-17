'use client'

/* ============================================================================
   CONSULT FUNNEL — SHARED ENGINE

   Five steps: contact, closest match, about you, format, time.

   THIS FILE IS IDENTICAL IN EVERY LP-FLEET REPO. Every practice-specific
   string comes from `lib/consult.config.ts`. If you find yourself editing this
   file for one client, the value belongs in that client's config instead.

   No office step: every client on this fleet books a single consulting
   location. A multi-office client needs a real office step, not a hardcoded
   second address — add it here for everyone, driven by config.

   Attribution is captured here rather than via the shared useGclid hook, which
   only handles `gclid`. This page needs all fourteen params, so it keeps its
   own capture and does not fork the shared hook.
   ========================================================================== */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CONSULT } from '@/lib/consult.config'

const TRACKED = [
  'gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'msclkid', 'wbraid', 'gbraid',
  /* Google Ads ValueTrack. Some accounts pass ?keyword={keyword} rather than
     utm_term, so both are captured. Capturing a param is not the same as
     writing it to the CRM: see CONSULT_FIELD_MAP in the config. */
  'keyword', 'matchtype', 'campaignid', 'adgroupid',
] as const

const NORWOOD = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
const LUDWIG = ['I', 'II', 'III']

const STEPS = [
  { id: 'contact', label: 'Your details' },
  { id: 'pattern', label: 'Closest match' },
  { id: 'about', label: 'About you' },
  { id: 'format', label: 'How you’d like to meet' },
  { id: 'time', label: 'Time' },
] as const

type Slot = { iso: string; day: string; time: string }
type Values = Record<string, string>

export default function ConsultFunnel() {
  const [step, setStep] = useState(0)
  const [v, setV] = useState<Values>({})
  const [consent, setConsent] = useState(false)
  const [consentAt, setConsentAt] = useState('')
  const [errors, setErrors] = useState<Values>({})

  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [slotsError, setSlotsError] = useState('')

  const [gate, setGate] = useState<'form' | 'verify' | 'done'>('form')
  const [challenge, setChallenge] = useState('')
  const [code, setCode] = useState(['', '', '', ''])
  const [vErr, setVErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  /* ---- attribution: URL wins, sessionStorage carries it across steps ---- */
  const attribution = useRef<Values>({})
  useEffect(() => {
    const url = new URLSearchParams(window.location.search)
    let saved: Values = {}
    try { saved = JSON.parse(sessionStorage.getItem('consult_attr') || '{}') } catch { saved = {} }
    TRACKED.forEach((k) => { const live = url.get(k); if (live) saved[k] = live })
    saved.landing_page ||= window.location.href.split('#')[0]
    saved.referrer ||= document.referrer || 'direct'
    try { sessionStorage.setItem('consult_attr', JSON.stringify(saved)) } catch {}
    attribution.current = saved
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const set = (k: string, value: string) => {
    setV((p) => ({ ...p, [k]: value }))
    setErrors((p) => (p[k] ? { ...p, [k]: '' } : p))
  }

  const digits = (s: string) => (s || '').replace(/\D/g, '')
  const fmtPhone = (raw: string) => {
    const d = digits(raw).slice(0, 10)
    if (d.length < 4) return d
    if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  }

  const validateContact = () => {
    const e: Values = {}
    if ((v.first_name || '').trim().length < 2) e.first_name = 'Enter at least two characters.'
    if ((v.last_name || '').trim().length < 2) e.last_name = 'Enter at least two characters.'
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.email || '')) e.email = 'That address is missing an @ or a domain.'
    if (digits(v.phone || '').length !== 10) e.phone = 'A US number is 10 digits.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const ready = useMemo(() => {
    const id = STEPS[step].id
    if (id === 'contact') {
      return ['first_name', 'last_name', 'email', 'phone'].every((k) => (v[k] || '').trim()) && consent
    }
    if (id === 'pattern') return !!v.pattern
    if (id === 'about') return !!v.age_range && !!v.prior_procedure
    if (id === 'format') return !!v.format
    if (id === 'time') return !!v.slot
    return false
  }, [step, v, consent])

  /* ---- slots load when the format is chosen ---- */
  const loadSlots = useCallback(async (format: string) => {
    setSlots(null); setSlotsError('')
    try {
      const r = await fetch(`/api/consult/slots?format=${encodeURIComponent(format)}`)
      if (!r.ok) throw new Error(String(r.status))
      const d = await r.json()
      setSlots(d.slots || [])
    } catch {
      /* An empty list and a failed read are different claims. */
      setSlotsError(`We could not load times just now. Call ${CONSULT.phoneDisplay} and we will book it for you.`)
    }
  }, [])

  const advance = async () => {
    if (STEPS[step].id === 'contact' && !validateContact()) return
    if (step === STEPS.length - 1) return beginVerify()
    const next = step + 1
    setStep(next)
    if (STEPS[next].id === 'time') loadSlots(v.format)
    document.getElementById('consult-book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /* ---- verification ---- */
  const sendCode = async () => {
    setBusy(true); setVErr('')
    try {
      const r = await fetch('/api/consult/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send', phone: digits(v.phone), practice: CONSULT.practice,
          first_name: v.first_name, last_name: v.last_name, email: v.email,
          format: v.format,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || 'send failed')
      setChallenge(d.challenge)
      setCooldown(30)
    } catch {
      setVErr(`We could not send the code. Check the number, or call ${CONSULT.phoneDisplay} and we will book it for you.`)
    } finally { setBusy(false) }
  }

  const beginVerify = async () => {
    setGate('verify')
    setCode(['', '', '', ''])
    await sendCode()
    otpRefs.current[0]?.focus()
  }

  const submitBooking = useCallback(async (typed: string) => {
    setBusy(true); setVErr('')
    try {
      const r = await fetch('/api/consult/book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...attribution.current, ...v,
          phone: digits(v.phone), code: typed, challenge,
          sms_consent: consent ? 'true' : 'false',
          consent_at: consentAt,
          consent_text_version: CONSULT.consentVersion,
        }),
      })
      const d = await r.json()
      if (r.ok && d.booked) {
        /* Stash the summary, then navigate. A real /c/consult/thank-you URL
           gives a genuine destination for a confirmation page instead of an
           in-place state, and gives the visitor a page worth landing on. */
        try {
          sessionStorage.setItem('consult_booking', JSON.stringify({
            name: v.first_name, email: v.email, format: v.format,
            slot: v.slot_label, pattern: v.pattern_label,
          }))
        } catch {}
        window.location.assign('/c/consult/thank-you')
        return
      }
      setVErr(d?.message || 'That code did not match. Check the text and try again.')
      setCode(['', '', '', '']); otpRefs.current[0]?.focus()
    } catch {
      setVErr('We could not reach the server. Try again in a moment.')
    } finally { setBusy(false) }
  }, [v, challenge, consent, consentAt])

  const onOtp = (i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(0, 1)
    const next = [...code]; next[i] = d; setCode(next); setVErr('')
    if (d && i < 3) otpRefs.current[i + 1]?.focus()
    if (next.every(Boolean)) submitBooking(next.join(''))
  }

  const pos = step + 1

  /* ------------------------------------------------------------------ UI -- */
  return (
    <div className="sheet">
      {gate === 'done' ? (
        <div className="done">
          <h2>You’re booked.</h2>
          <p>
            A confirmation is on its way to <b>{v.email}</b>, and a text reminder lands the day before.
            We’ll see you then.
          </p>
          <div className="receipt">
            <div><span>Name</span><b>{v.first_name} {v.last_name}</b></div>
            <div><span>Closest match</span><b>{v.pattern_label || 'Not specified'}</b></div>
            <div><span>Format</span><b>{v.format === 'virtual' ? 'Virtual' : 'In person'}</b></div>
            <div><span>Time</span><b>{v.slot_label}</b></div>
          </div>
        </div>
      ) : gate === 'verify' ? (
        <div className="verify">
          <h2 className="step-title">Check your phone.</h2>
          <p className="step-note">
            We sent a 4-digit code to <b>{fmtPhone(v.phone)}</b>. Enter it to confirm the appointment.
          </p>
          <div className="otp" role="group" aria-label="4-digit verification code">
            {code.map((c, i) => (
              <input
                key={i} value={c} inputMode="numeric" maxLength={1}
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                aria-label={`Digit ${i + 1}`}
                ref={(el) => { otpRefs.current[i] = el }}
                onChange={(e) => onOtp(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !c && i > 0) otpRefs.current[i - 1]?.focus()
                }}
                onPaste={(e) => {
                  const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
                  if (!d) return
                  e.preventDefault()
                  const next = ['', '', '', ''].map((_, k) => d[k] || '')
                  setCode(next)
                  if (next.every(Boolean)) submitBooking(next.join(''))
                }}
              />
            ))}
          </div>
          <p className="otp-msg" role="alert">{vErr}</p>
          <div className="actions">
            <button className="btn ghost" type="button" disabled={cooldown > 0 || busy} onClick={sendCode}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
          <p className="otp-foot">
            Wrong number?{' '}
            <button type="button" className="linkish" onClick={() => { setGate('form'); setStep(0) }}>
              Go back and change it
            </button>. The code expires in five minutes.
          </p>
        </div>
      ) : (
        <>
          <div className="steps" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={pos}>
            {STEPS.map((_, i) => (
              <span key={i} data-tick="" data-state={i < step ? 'done' : i === step ? 'now' : 'todo'} />
            ))}
          </div>
          <p className="steps-meta">{pos} of {STEPS.length} &middot; {STEPS[step].label}</p>

          {STEPS[step].id === 'contact' && (
            <div>
              <h2 className="step-title">Schedule your consult.</h2>
              <p className="step-note">Four fields. No health question on this screen, and nothing typed here reaches an advertising platform.</p>
              <div className="stack">
                <div className="row two">
                  <Field id="first_name" label="First name" v={v} set={set} errors={errors} autoComplete="given-name" placeholder="First Name" />
                  <Field id="last_name" label="Last name" v={v} set={set} errors={errors} autoComplete="family-name" placeholder="Last Name" />
                </div>
                <Field id="email" label="Email" v={v} set={set} errors={errors} type="email" autoComplete="email" placeholder="you@example.com" />
                <Field id="phone" label="Mobile" v={v} set={set} errors={errors} type="tel" inputMode="tel"
                       autoComplete="tel" placeholder={CONSULT.phonePlaceholder} transform={fmtPhone} />
              </div>
              <label className="consent">
                <input type="checkbox" checked={consent} onChange={(e) => {
                  setConsent(e.target.checked)
                  setConsentAt(e.target.checked ? new Date().toISOString() : '')
                }} />
                <p>
                  {CONSULT.practice} uses text messages to confirm and manage online appointments. To complete
                  scheduling, you agree to receive reminders about appointments, transactions, special
                  offers, exclusive event invites, and occasional promotions. By submitting this form, you
                  {/* The Terms clause is omitted rather than pointed at a dead URL when that
                      practice has no reachable terms page. A consent notice whose own link
                      404s is worse than one that does not cite terms: it reads as diligence
                      and evidences nothing. Clients in that state are listed in the build
                      notes and need a terms page on-subdomain before ads point here. */}
                  {CONSULT.termsUrl ? (
                    <> agree to {CONSULT.practice}’s <a href={CONSULT.termsUrl}>Terms of Use</a> and consent</>
                  ) : (
                    <> consent</>
                  )} to receive
                  calls, emails, and text messages from {CONSULT.practice}, which may be live, automated, or
                  prerecorded. You can opt out at any time by texting “STOP.” Consent is not required to
                  receive services. Standard message and data rates may apply. Please see our{' '}
                  <a href={CONSULT.privacyUrl}>Privacy Policy</a> for more information.
                </p>
              </label>
            </div>
          )}

          {STEPS[step].id === 'pattern' && (
            <div>
              <h2 className="step-title">Which of these is closest?</h2>
              <p className="step-note">
                Both clinical scales, side by side. <b>Pick the nearest one</b>, or say you are not sure.
                It only tells the office what to prepare for.
              </p>

              <p className="scale-head"><b>Norwood</b><span>most often used for men</span></p>
              <div className="scale-grid">
                {NORWOOD.map((roman, i) => (
                  <Stage key={roman} scale="Norwood" roman={roman} src={`/consult/norwood-${i + 1}.webp`}
                         value={`norwood-${i + 1}`} v={v} set={set} />
                ))}
              </div>

              <p className="scale-head"><b>Ludwig</b><span>most often used for women</span></p>
              <div className="scale-grid three">
                {LUDWIG.map((roman, i) => (
                  <Stage key={roman} scale="Ludwig" roman={roman} src={`/consult/ludwig-${i + 1}.webp`}
                         value={`ludwig-${i + 1}`} v={v} set={set} />
                ))}
              </div>

              <button type="button" className="scale-unsure" data-choice="unsure"
                      aria-pressed={v.pattern === 'unsure'}
                      onClick={() => { set('pattern', 'unsure'); set('pattern_label', 'Not sure') }}>
                <b>I’m not sure</b>
                <span>You can work it out at the consult. This is a normal answer.</span>
              </button>
            </div>
          )}

          {STEPS[step].id === 'about' && (
            <div>
              <h2 className="step-title">Two quick questions.</h2>
              <p className="step-note">Both change how the appointment is scheduled, nothing else.</p>
              <div className="stack">
                <Select id="age_range" label="Age range" v={v} set={set}
                        options={['18 to 24', '25 to 34', '35 to 44', '45 to 54', '55 to 64', '65 or over']} />
                <Select id="prior_procedure" label="Have you had a procedure before?" v={v} set={set}
                        options={['No, this would be the first', 'Yes, elsewhere', 'Yes, here', 'Prefer not to say']} />
              </div>
              <p className="step-hint">A previous procedure means the appointment is booked longer, because the donor area is assessed as well.</p>
            </div>
          )}

          {STEPS[step].id === 'format' && (
            <div>
              <h2 className="step-title">In person or virtual?</h2>
              <p className="step-note">Same clinician, same appointment, either way.</p>
              <div className="formats">
                <button type="button" data-choice="in-person" aria-pressed={v.format === 'in-person'}
                        onClick={() => { set('format', 'in-person'); set('format_label', 'In person') }}>
                  <svg className="ficon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 18s6-5.2 6-9.4A6 6 0 0 0 4 8.6C4 12.8 10 18 10 18Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><circle cx="10" cy="8.4" r="2.2" stroke="currentColor" strokeWidth="1.6"/></svg>
                  <span className="ft">In person</span>
                  <span className="fs">{CONSULT.inPersonWhere}</span>
                  <span className="fbadge">{CONSULT.durationLabel}</span>
                </button>
                <button type="button" data-choice="virtual" aria-pressed={v.format === 'virtual'}
                        onClick={() => { set('format', 'virtual'); set('format_label', 'Virtual') }}>
                  <svg className="ficon" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2" y="5.5" width="11" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="m13 9.5 5-2.6v6.2l-5-2.6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
                  <span className="ft">Virtual</span>
                  <span className="fs">By video, wherever you are.</span>
                  <span className="fbadge alt">{CONSULT.durationLabel}, no travel</span>
                </button>
              </div>
              <p className="step-hint">Booking one does not commit you to the other. People move between the two all the time.</p>
            </div>
          )}

          {STEPS[step].id === 'time' && (
            <div>
              <h2 className="step-title">Pick your time.</h2>
              <p className="step-note">
                {CONSULT.durationLabel}, <b>{v.format === 'virtual' ? 'by video' : `in ${CONSULT.officeShort}`}</b>.
                {' '}{CONSULT.hoursLine}
              </p>
              {slotsError && <p className="otp-msg" role="alert">{slotsError}</p>}
              {!slots && !slotsError && <p className="step-hint">Loading live availability…</p>}
              {slots && slots.length === 0 && (
                <p className="step-hint">No times are published for the next two weeks. Call {CONSULT.phoneDisplay} and we will find one.</p>
              )}
              {slots && slots.length > 0 && (
                <div className="slots">
                  {slots.slice(0, 12).map((s) => (
                    <button key={s.iso} type="button" className="slot" data-choice={s.iso}
                            aria-pressed={v.slot === s.iso}
                            onClick={() => { set('slot', s.iso); set('slot_label', `${s.day}, ${s.time}`) }}>
                      <span className="day">{s.day}</span>
                      <span className="hour">{s.time}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="actions">
            <button className="btn primary" type="button" disabled={!ready || busy} onClick={advance}>
              {step === 0 || step === STEPS.length - 1 ? 'Schedule your consult' : 'Continue'}
            </button>
            {step > 0 && (
              <button className="btn ghost" type="button" onClick={() => setStep((s) => s - 1)}>Back</button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ primitives -- */
function Field({ id, label, v, set, errors, transform, ...rest }: any) {
  const err = errors[id]
  return (
    <span className="field" data-field="" data-state={err ? 'invalid' : v[id] ? 'valid' : ''}>
      <label htmlFor={id}>{label}</label>
      <input id={id} value={v[id] || ''} aria-invalid={err ? 'true' : undefined}
             onChange={(e) => set(id, transform ? transform(e.target.value) : e.target.value)} {...rest} />
      <span data-error="" role="alert">{err || ''}</span>
    </span>
  )
}

function Select({ id, label, v, set, options }: any) {
  return (
    <span className="field" data-field="" style={{ ['--tick-bottom' as any]: '18px' }}>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={v[id] || ''} onChange={(e) => set(id, e.target.value)}>
        <option value="">Select</option>
        {options.map((o: string) => <option key={o}>{o}</option>)}
      </select>
      <svg className="chev" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2 4.5 6 8.5l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span data-error="" role="alert" />
    </span>
  )
}

function Stage({ scale, roman, src, value, v, set }: any) {
  const label = `${scale} ${roman}`
  return (
    <button type="button" className="stage" aria-pressed={v.pattern === value} aria-label={label}
            onClick={() => { set('pattern', value); set('pattern_label', label) }}>
      <img src={src} alt="" width={136} height={196} loading="lazy" decoding="async" />
      <b>{roman}</b>
    </button>
  )
}
