'use client'
import { useEffect, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// EFFVIT canonical GHL form embed. Do not fork this per client.
//
// Three rules, each paid for with a real outage. See the
// `effvit-ghl-form-embed` skill for the full contract.
//
// 1. PARAMS BEFORE MOUNT. The iframe is not rendered until the click ids and
//    UTMs have been resolved, so its `src` is never mutated after mount.
//    Swapping src post-mount reloads the widget and blanks the form.
//
// 2. form_embed.js IS MANDATORY. It is GHL's parent-page bridge: it posts
//    `document.location.href` + `document.referrer` + the merged query params
//    to the widget. Without it the widget only sees the iframe's cross-origin
//    Referer, which the browser trims to the bare origin under the default
//    strict-origin-when-cross-origin policy — so every lead lands in GHL as
//    `sessionSource: "Direct traffic"` with null gclid/utm/referrer, even on a
//    real paid click. (Biltmore, 2026-07-16 to 07-23.) It is injected once per
//    page, after every mounted form has its final src.
//
// 3. NEVER LOAD A SECOND IFRAME-RESIZER. form_embed.js bundles its own and
//    re-parents each iframe into an `<id>-wrapper` div. A standalone
//    iframe-resizer then throws `iFrame (<id>) does not exist`, and that
//    uncaught error aborts form_embed's init and leaves an empty wrapper — the
//    form disappears entirely. That is the crash that got form_embed.js
//    deleted from the fleet in the first place. form_embed.js owns resizing.
//
// Hidden-field aliasing (H-27): GHL silently discards any param without a
// matching hidden field on the form. The gclid field was created with key
// `gclid-of`, so the plain `?gclid=` never matches — all spellings are sent.
// ─────────────────────────────────────────────────────────────────────────────

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
const CLICK_ID_KEYS = ['gclid', 'gbraid', 'wbraid', 'fbclid']

const FORM_EMBED_SRC = 'https://link.msgsndr.com/js/form_embed.js'

// Default GHL widget host. Elite MD overrides it: api.leadconnectorhq.com is
// DNS-blocked for that practice's visitors, so its forms are served from a
// white-labelled host instead. form_embed.js talks to the iframe by
// contentWindow.postMessage(msg, '*'), so a non-default host still works.
const DEFAULT_HOST = 'api.leadconnectorhq.com'

// form_embed.js processes every form iframe present when it runs, so one
// injection covers a page with several forms. Components mount in the same
// commit; the short delay lets them all settle before the script lands.
let embedScheduled = false
function injectFormEmbedOnce() {
  if (embedScheduled) return
  embedScheduled = true
  setTimeout(() => {
    if (document.querySelector(`script[src="${FORM_EMBED_SRC}"]`)) return
    appendFormEmbed(0)
  }, 50)
}

// form_embed.js is the ONLY thing that resizes the iframe. If it fails to load
// the iframe keeps the hardcoded `height` prop forever, which renders a
// truncated form: on a real iPhone 2026-11-16 a colgrove page painted 230px of
// a 594px form -- two fields, no consent, no submit button -- and measured
// clean in every local test, because a local test never drops the script.
// Measured the same day with the script blocked: lafue and mollura iframes sat
// at 400px against 665-758px of form, biltmore 620 against 707, sage-metuchen
// 729 against 952. Retry once, then fall back to a height that fits the
// tallest form on the fleet so the submit button is always reachable.
const FORM_EMBED_FALLBACK_H = 980
function appendFormEmbed(attempt: number) {
  const s = document.createElement('script')
  s.src = FORM_EMBED_SRC
  s.async = true
  s.onerror = () => {
    s.remove()
    if (attempt < 1) { setTimeout(() => appendFormEmbed(attempt + 1), 1200); return }
    expandUnresizedForms('script-error')
  }
  document.body.appendChild(s)
  // Belt and braces: the script can load and still never resize (blocked
  // postMessage, slow widget). If nothing has grown by then, expand anyway.
  setTimeout(expandUnresizedForms, 6000)
}

// Only touches iframes still sitting at their initial inline height, so a form
// that resized normally is never given dead whitespace.
function expandUnresizedForms(reason: 'script-error' | 'no-resize' = 'no-resize') {
  document.querySelectorAll<HTMLIFrameElement>('iframe[data-form-id]').forEach((f) => {
    const initial = Number(f.getAttribute('data-height') || '0')
    const now = Math.round(f.getBoundingClientRect().height)
    if (now < FORM_EMBED_FALLBACK_H) {
      f.style.height = `${FORM_EMBED_FALLBACK_H}px`
      reportRescue(f, initial, reason)
    }
  })
}

// This is the number nobody has ever had: how often a real visitor met a
// truncated form. The defect was invisible to every automated check we run,
// because a local test never drops form_embed.js. Fire-and-forget; a telemetry
// call must never be able to break the page it is reporting on.
let rescueReported = false
function reportRescue(f: HTMLIFrameElement, initial: number, reason: string) {
  if (rescueReported) return
  rescueReported = true
  try {
    const body = JSON.stringify({
      path: location.pathname,
      formId: f.getAttribute('data-form-id'),
      initialH: initial,
      rescuedTo: FORM_EMBED_FALLBACK_H,
      viewportW: window.innerWidth,
      isMobile: window.innerWidth < 768,
      reason,
    })
    const url = 'https://control.effvit.com/api/lp-telemetry/form-rescue'
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'text/plain;charset=UTF-8' })  // safelisted: sendBeacon cannot preflight)
    } else {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
    }
  } catch { /* never surface */ }
}

export default function GhlForm({
  formId,
  height = 620,
  formName = '',
  host = DEFAULT_HOST,
}: {
  formId: string
  height?: number
  formName?: string
  host?: string
}) {
  const widgetBase = `https://${host}/widget/form`
  // null until params are resolved — the iframe does not render before then.
  const [src, setSrc] = useState<string | null>(null)
  const iframeId = `inline-${formId}`

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const out = new URLSearchParams()

    // sessionStorage fallback keeps attribution alive across internal
    // navigation, where the landing params are no longer in the URL.
    ;[...CLICK_ID_KEYS, ...UTM_KEYS].forEach(key => {
      const val = urlParams.get(key) || sessionStorage.getItem(key)
      if (val) {
        try { sessionStorage.setItem(key, val) } catch { /* private mode */ }
        out.set(key, val)
      }
    })

    // utm_* and gbraid/wbraid slugs match their params exactly; the two click
    // ids whose GHL field keys differ get aliased to every spelling in use.
    const gclid = out.get('gclid')
    if (gclid) { out.set('gclid-of', gclid); out.set('gclidof', gclid) }
    const fbclid = out.get('fbclid')
    if (fbclid) { out.set('fbclid-of', fbclid); out.set('fbclidof', fbclid) }

    const qs = out.toString()
    setSrc(qs ? `${widgetBase}/${formId}?${qs}` : `${widgetBase}/${formId}`)
  }, [formId, widgetBase])

  useEffect(() => {
    if (src) injectFormEmbedOnce()
  }, [src])

  // Reserve the space so resolving params does not shift the page.
  if (!src) {
    return <div style={{ width: '100%', height: `${height}px` }} aria-hidden="true" />
  }

  return (
    <iframe
      src={src}
      style={{ width: '100%', height: `${height}px`, border: 'none', borderRadius: '0px', display: 'block' }}
      id={iframeId}
      data-layout='{"id":"INLINE"}'
      data-trigger-type="alwaysShow"
      data-trigger-value=""
      data-activation-type="alwaysActivated"
      data-activation-value=""
      data-deactivation-type="neverDeactivate"
      data-deactivation-value=""
      data-form-name={formName}
      data-height={height}
      data-layout-iframe-id={iframeId}
      data-form-id={formId}
      title={formName || formId}
    />
  )
}
