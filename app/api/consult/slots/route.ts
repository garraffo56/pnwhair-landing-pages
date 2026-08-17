import { NextRequest, NextResponse } from 'next/server'
import { getSlots, CALENDARS, type ConsultFormat } from '@/lib/consult'

export const dynamic = 'force-dynamic'

/* Live availability for one consultation format. Hours, buffers and staff are
   configured in GHL; this only reads what that calendar already publishes. */
export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get('format') as ConsultFormat | null
  if (!format || !(format in CALENDARS)) {
    return NextResponse.json({ error: 'format must be in-person or virtual' }, { status: 400 })
  }
  try {
    const slots = await getSlots(format)
    return NextResponse.json({ format, slots })
  } catch (err: any) {
    console.error('[consult/slots]', err?.status, err?.message, err?.body)
    /* An empty list and a failed read are different claims with different
       owners, so the failure says so rather than returning []. */
    return NextResponse.json(
      { error: 'could not read availability', detail: err?.status || null },
      { status: 502 }
    )
  }
}
