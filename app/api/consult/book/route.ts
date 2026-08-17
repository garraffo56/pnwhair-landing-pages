import { NextRequest, NextResponse } from 'next/server'
import {
  checkChallenge, upsertContact, writeCustomFields, createAppointment,
  CALENDARS, type ConsultFormat,
} from '@/lib/consult'

export const dynamic = 'force-dynamic'

const TRACKED = [
  'gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'msclkid', 'wbraid', 'gbraid', 'landing_page', 'referrer',
]

export async function POST(req: NextRequest) {
  let lead: any
  try {
    lead = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }

  const phone = String(lead.phone || '').replace(/\D/g, '')
  const format = lead.format as ConsultFormat

  if (phone.length !== 10) return NextResponse.json({ error: 'phone must be 10 digits' }, { status: 400 })
  if (!(format in CALENDARS)) return NextResponse.json({ error: 'unknown format' }, { status: 400 })
  if (!lead.slot) return NextResponse.json({ error: 'no slot selected' }, { status: 400 })

  /* The client's own phone_verified flag is not evidence of anything: this
     endpoint is reachable directly. Re-check the signed challenge server side,
     or an unverified number books an appointment by skipping the UI. */
  const verdict = checkChallenge(phone, String(lead.code || ''), String(lead.challenge || ''))
  if (!verdict.verified) {
    return NextResponse.json({ error: 'not verified', message: verdict.message }, { status: 403 })
  }

  try {
    const contactId = await upsertContact({ ...lead, phone: `+1${phone}` })

    /* Attribution write is reported, never assumed. writeCustomFields returns a
       reason when the map is empty so a silent no-op cannot read as success. */
    const attribution = await writeCustomFields(
      contactId,
      Object.fromEntries(
        [...TRACKED, 'pattern', 'format', 'age_range', 'prior_procedure',
         'sms_consent', 'consent_at', 'consent_text_version']
          .map((k) => [k, lead[k]])
      )
    )

    const appointment = await createAppointment({
      contactId, format, startIso: String(lead.slot),
    })

    return NextResponse.json({
      booked: true,
      contactId,
      appointmentId: appointment?.id || appointment?.appointment?.id || null,
      attribution,
    })
  } catch (err: any) {
    console.error('[consult/book]', err?.status, err?.message, err?.body)
    /* 409 is GHL rejecting the slot, which means someone took it while this
       person was typing. That is a different message from a broken pipe. */
    if (err?.status === 409 || /slot/i.test(String(err?.body?.message || ''))) {
      return NextResponse.json(
        { error: 'slot taken', message: 'That time was booked while you were finishing. Pick another and it will hold.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'could not complete the booking', detail: err?.status || null },
      { status: 502 }
    )
  }
}
