'use client'

/* Reads the booking the funnel stashed just before navigating here. Renders
   nothing at all if there is no stash — someone landing on this URL directly
   should see the page, not an empty receipt with blank rows. */
import { useEffect, useState } from 'react'

type Booking = { name?: string; email?: string; format?: string; slot?: string; pattern?: string }

export default function BookingSummary({ address, city }: { address: string; city: string }) {
  const [b, setB] = useState<Booking | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('consult_booking')
      if (raw) setB(JSON.parse(raw))
    } catch { /* private mode or cleared storage: fall through to the generic copy */ }
  }, [])

  if (!b) {
    return (
      <p className="thanks-sub">
        Your consultation is confirmed. A confirmation email is on its way, and a text reminder
        lands the day before.
      </p>
    )
  }

  const virtual = b.format === 'virtual'
  return (
    <>
      <p className="thanks-sub">
        {b.name ? `Thanks, ${b.name}. ` : ''}A confirmation is on its way
        {b.email ? <> to <b>{b.email}</b></> : null}, and a text reminder lands the day before.
      </p>
      <dl className="receipt">
        {b.slot && <div><span>When</span><b>{b.slot}</b></div>}
        <div><span>Format</span><b>{virtual ? 'Virtual, by video' : 'In person'}</b></div>
        {!virtual && <div><span>Where</span><b>{address}, {city}</b></div>}
      </dl>
    </>
  )
}
