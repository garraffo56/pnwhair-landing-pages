/* ============================================================================
   CONSULT FUNNEL — server layer (SHARED ENGINE)

   Owns every call into GoHighLevel for the /c/consult booking page, plus the
   phone-verification codec.

   THIS FILE IS IDENTICAL IN EVERY LP-FLEET REPO. Everything client-specific
   lives in `lib/consult.config.ts` beside it. Do not fork this file per client:
   the fleet already learned that lesson on GhlForm.tsx, where per-client copies
   drifted and shipped two opposite outages.

   Why verification is stateless: these apps run on Coolify with no database and
   no Redis. An in-memory Map dies on every deploy and, worse, reads as working
   from inside the process while silently losing every code in flight. Instead
   the server signs {phone, codeHash, exp, nonce} with HMAC-SHA256 and hands the
   client an opaque token; the client returns it with the typed code. Nothing to
   store, nothing to drift, correct across container restarts and replicas.
   ========================================================================== */
import crypto from 'crypto'
import { CONSULT, CONSULT_FIELD_MAP } from './consult.config'

export const LOCATION_ID = CONSULT.locationId
export const TIMEZONE = CONSULT.timezone
export const CALENDARS = CONSULT.calendars

export type ConsultFormat = keyof typeof CONSULT.calendars

const GHL = 'https://services.leadconnectorhq.com'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function token(): string {
  const t = process.env[`GHL_PIT_${LOCATION_ID}`]
  if (!t) throw new Error(`GHL_PIT_${LOCATION_ID} is not set on this container`)
  return t
}

/* Cloudflare in front of the GHL API returns error 1010 to clients whose TLS
   fingerprint it does not like, and a bare fetch from Node is one of them. The
   User-Agent is not cosmetic; without it every call 403s with a body that reads
   like an auth failure and is not one. */
async function ghl(path: string, init: RequestInit = {}, version = '2021-07-28') {
  const res = await fetch(GHL + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      Version: version,
      Accept: 'application/json',
      'User-Agent': UA,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
    cache: 'no-store',
  })
  const text = await res.text()
  let body: any = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  if (!res.ok) {
    const err: any = new Error(`GHL ${res.status} on ${path}`)
    err.status = res.status
    err.body = body
    throw err
  }
  return body
}

/* ---------------------------------------------------------------- slots --- */
export type Slot = { iso: string; day: string; time: string }

export async function getSlots(format: ConsultFormat, days = 14): Promise<Slot[]> {
  const calendarId = CALENDARS[format]
  const now = Date.now()
  const end = now + days * 86_400_000
  const body = await ghl(
    `/calendars/${calendarId}/free-slots?startDate=${now}&endDate=${end}&timezone=${encodeURIComponent(TIMEZONE)}`,
    {},
    '2021-04-15'
  )

  /* The response is keyed by date, each with a slots array of ISO strings. Any
     non-date key (traceId and friends) is skipped rather than assumed absent. */
  const out: Slot[] = []
  for (const key of Object.keys(body || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue
    for (const iso of body[key]?.slots || []) {
      const d = new Date(iso)
      out.push({
        iso,
        day: d.toLocaleDateString('en-US', {
          weekday: 'long', day: 'numeric', month: 'short', timeZone: TIMEZONE,
        }),
        time: d.toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit', timeZone: TIMEZONE,
        }),
      })
    }
  }
  return out.sort((a, b) => a.iso.localeCompare(b.iso))
}

/* ------------------------------------------------------------- contacts --- */
export type Lead = Record<string, string | boolean | undefined>

export async function upsertContact(lead: Lead): Promise<string> {
  const res = await ghl('/contacts/upsert', {
    method: 'POST',
    body: JSON.stringify({
      locationId: LOCATION_ID,
      firstName: lead.first_name,
      lastName: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      postalCode: lead.zip,
      source: 'Consult LP',
      tags: ['consult-lp', `format-${lead.format || 'unset'}`],
    }),
  })
  const id = res?.contact?.id || res?.id
  if (!id) throw new Error('contact upsert returned no id')
  return id
}

export async function writeCustomFields(contactId: string, lead: Lead) {
  const entries = Object.entries(CONSULT_FIELD_MAP)
    .filter(([payloadKey]) => lead[payloadKey] !== undefined && lead[payloadKey] !== '')
    .map(([payloadKey, fieldKey]) => ({ key: fieldKey, field_value: String(lead[payloadKey]) }))

  if (!entries.length) {
    /* Says which, rather than reporting silence as success. An empty map is a
       real state on this fleet: most sub-account PITs still lack the
       customFields read scope, so the map could not be seeded from the live
       API and was deliberately left empty rather than guessed (H-41). */
    return { written: 0, reason: 'CONSULT_FIELD_MAP is empty; PIT lacks customFields read scope' }
  }
  await ghl(`/contacts/${contactId}`, {
    method: 'PUT',
    body: JSON.stringify({ customFields: entries }),
  })
  return { written: entries.length }
}

/* ---------------------------------------------------------- appointment --- */
export async function createAppointment(opts: {
  contactId: string
  format: ConsultFormat
  startIso: string
}) {
  return ghl('/calendars/events/appointments', {
    method: 'POST',
    body: JSON.stringify({
      calendarId: CALENDARS[opts.format],
      locationId: LOCATION_ID,
      contactId: opts.contactId,
      startTime: opts.startIso,
      selectedTimezone: TIMEZONE,
      /* Confirmed, not pending: the slot came from free-slots and the phone is
         verified by the time this runs. */
      appointmentStatus: 'confirmed',
      ignoreFreeSlotValidation: false,
    }),
  })
}

/* ------------------------------------------------------------------ SMS --- */
export async function sendSms(contactId: string, message: string) {
  return ghl('/conversations/messages', {
    method: 'POST',
    body: JSON.stringify({ type: 'SMS', contactId, message }),
  })
}

/* --------------------------------------------------------- verification --- */
function secret(): string {
  const s = process.env.CONSULT_SIGNING_SECRET
  if (!s) throw new Error('CONSULT_SIGNING_SECRET is not set on this container')
  return s
}

const b64 = (b: Buffer) => b.toString('base64url')
const hmac = (data: string) => b64(crypto.createHmac('sha256', secret()).update(data).digest())

export function newCode(): string {
  /* Uniform over 0000-9999. Modulo on a byte would bias the low digits. */
  return String(crypto.randomInt(0, 10_000)).padStart(4, '0')
}

export function signChallenge(phone: string, code: string, ttlMs = 5 * 60_000): string {
  const payload = {
    p: phone.replace(/\D/g, ''),
    c: hmac(`code:${phone.replace(/\D/g, '')}:${code}`),
    e: Date.now() + ttlMs,
    n: b64(crypto.randomBytes(9)),
  }
  const body = b64(Buffer.from(JSON.stringify(payload)))
  return `${body}.${hmac(body)}`
}

export type CheckResult = { verified: boolean; message?: string }

export function checkChallenge(phone: string, code: string, challenge: string): CheckResult {
  const [body, sig] = String(challenge || '').split('.')
  if (!body || !sig) return { verified: false, message: 'That session expired. Send a new code.' }

  /* Timing-safe: a plain === leaks how much of the signature matched. */
  const expected = hmac(body)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { verified: false, message: 'That session expired. Send a new code.' }
  }

  let payload: any
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString())
  } catch {
    return { verified: false, message: 'That session expired. Send a new code.' }
  }

  if (Date.now() > payload.e) return { verified: false, message: 'That code expired. Send a new one.' }
  if (payload.p !== phone.replace(/\D/g, '')) {
    return { verified: false, message: 'That code was sent to a different number.' }
  }

  const want = Buffer.from(payload.c)
  const got = Buffer.from(hmac(`code:${payload.p}:${code}`))
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) {
    return { verified: false, message: 'That code did not match. Check the text and try again.' }
  }
  return { verified: true }
}
