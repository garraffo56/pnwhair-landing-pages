'use client'
import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
const CLICK_ID_KEYS = ['gclid', 'gbraid', 'wbraid']

declare global {
  interface Window {
    iFrameResize?: (options: Record<string, unknown>, selector: string) => void
  }
}

export default function GhlForm({
  formId,
  height = 620,
  formName = '',
}: {
  formId: string
  height?: number
  formName?: string
}) {
  const [src, setSrc] = useState(`https://api.leadconnectorhq.com/widget/form/${formId}`)
  const iframeId = `inline-${formId}`
  const retries = useRef(0)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const out = new URLSearchParams()

    ;[...CLICK_ID_KEYS, ...UTM_KEYS].forEach(key => {
      const val = urlParams.get(key) || sessionStorage.getItem(key)
      if (val) {
        sessionStorage.setItem(key, val)
        out.set(key, val)
      }
    })

    // The form's gclid custom field was created with key "gclid-of", so GHL's
    // hidden-field prefill never matches the standard ?gclid= param — alias it.
    // (utm_* and gbraid/wbraid slugs match their params exactly; only gclid differs.)
    const gclid = out.get('gclid')
    if (gclid) {
      out.set('gclid-of', gclid)
      out.set('gclidof', gclid)
    }

    if (out.toString()) {
      setSrc(`https://api.leadconnectorhq.com/widget/form/${formId}?${out.toString()}`)
    }
  }, [formId])

  // GHL's form iframe ships the iframe-resizer "child" script and broadcasts
  // [iFrameResizerChild]Ready over postMessage, but never gets a reply unless
  // this page loads the matching "parent" script — without it the iframe stays
  // at the fixed `height` guess, clipping the submit button whenever the form
  // (fields, validation errors, legal copy) grows taller. Same fix as
  // rhrli-landing-pages a37afd3. (Do not pass heightCalculationMethod:
  // 'lowestElement' — it balloons the iframe to 7000+px.)
  const initResize = () => {
    if (window.iFrameResize) {
      window.iFrameResize(
        { checkOrigin: false, log: false },
        `#${iframeId}`
      )
    } else if (retries.current < 25) {
      retries.current += 1
      setTimeout(initResize, 200)
    }
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/iframe-resizer@4.3.9/js/iframeResizer.min.js"
        strategy="afterInteractive"
        onLoad={initResize}
      />
      <iframe
        src={src}
        style={{ width: '100%', height: `${height}px`, border: 'none', borderRadius: '0px', display: 'block' }}
        id={iframeId}
        onLoad={initResize}
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
      {/* form_embed.js intentionally NOT loaded: it crashes ("iFrame does not
          exist") when React swaps the iframe src to inject params, and its failed
          handshake leaves the GHL widget invisible. iframe-resizer above does the
          resize job; params are injected into the src directly. */}
    </>
  )
}
