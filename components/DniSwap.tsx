'use client'
import { useEffect } from 'react'

// Session-level dynamic number insertion. Paid sessions (gclid/gbraid/wbraid
// present) lease a tracking number from control.effvit.com and every visible
// instance of the static number is swapped, so an inbound call maps back to
// this exact session's click id. Organic/direct sessions never lease — they
// keep the static number, by design. Any failure (endpoint down, pool off,
// no numbers) leaves the page untouched.

const DNI_ENDPOINT = 'https://control.effvit.com/api/dni/lease'
const CLIENT = 'pnw'
const DEFAULT_DIGITS = '5037825749'

function formatDashes(e164: string): string {
  const d = e164.replace(/\D/g, '').replace(/^1/, '')
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
}

function swapNumber(e164: string) {
  const digits = e164.replace(/\D/g, '').replace(/^1/, '')
  if (digits.length !== 10) return
  const formatted = formatDashes(e164)

  // tel: links (any href carrying the default digits, with or without +1)
  document.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]').forEach((a) => {
    if (a.href.replace(/\D/g, '').includes(DEFAULT_DIGITS)) {
      a.href = `tel:+1${digits}`
    }
  })

  // visible text nodes containing any common formatting of the default number
  const pattern = new RegExp(
    `\\(?${DEFAULT_DIGITS.slice(0, 3)}\\)?[\\s.\\-]?${DEFAULT_DIGITS.slice(3, 6)}[\\s.\\-]?${DEFAULT_DIGITS.slice(6)}`,
    'g',
  )
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const hits: Text[] = []
  while (walker.nextNode()) {
    const t = walker.currentNode as Text
    if (t.nodeValue && pattern.test(t.nodeValue)) hits.push(t)
    pattern.lastIndex = 0
  }
  hits.forEach((t) => {
    t.nodeValue = t.nodeValue!.replace(pattern, formatted)
  })
}

export default function DniSwap() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const grab = (k: string) => {
        const v = params.get(k)
        if (v) sessionStorage.setItem(k, v)
        return v ?? sessionStorage.getItem(k)
      }
      const gclid = grab('gclid')
      const gbraid = grab('gbraid')
      const wbraid = grab('wbraid')
      if (!gclid && !gbraid && !wbraid) return

      let sessionKey = sessionStorage.getItem('dni_sk')
      if (!sessionKey) {
        sessionKey = crypto.randomUUID()
        sessionStorage.setItem('dni_sk', sessionKey)
      }

      // Swap instantly from a cached lease, then refresh it in the background
      // (the server is sticky per sessionKey, so the number can only stay the
      // same — the refresh just slides the lease window).
      const cached = sessionStorage.getItem('dni_lease')
      if (cached) {
        try {
          const { number, exp } = JSON.parse(cached)
          if (number && exp > Date.now()) swapNumber(number)
        } catch { /* ignore */ }
      }

      const utm: Record<string, string> = {}
      for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
        const v = params.get(k) ?? sessionStorage.getItem(k)
        if (v) { utm[k] = v; sessionStorage.setItem(k, v) }
      }

      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 2500)
      fetch(DNI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: CLIENT,
          sessionKey,
          gclid, gbraid, wbraid,
          utm,
          page: window.location.pathname,
        }),
        signal: ctrl.signal,
      })
        .then((r) => r.json())
        .then(({ lease }) => {
          if (lease?.number) {
            sessionStorage.setItem('dni_lease', JSON.stringify({
              number: lease.number,
              exp: Date.now() + (lease.ttlSeconds ?? 1800) * 1000,
            }))
            swapNumber(lease.number)
            // React re-renders (accordions, carousels) restore the static
            // number from their own props — watch and re-apply. The swap is
            // idempotent (swapped text no longer matches), so the observer
            // can't loop on its own mutations.
            let pending: number | null = null
            const observer = new MutationObserver(() => {
              if (pending) return
              pending = window.setTimeout(() => {
                pending = null
                swapNumber(lease.number)
              }, 250)
            })
            observer.observe(document.body, { childList: true, subtree: true, characterData: true })
          }
        })
        .catch(() => { /* static number stays — correct fallback */ })
        .finally(() => clearTimeout(timer))
    } catch { /* never break the page */ }
  }, [])

  return null
}
