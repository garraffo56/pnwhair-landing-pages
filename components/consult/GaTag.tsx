'use client'

/* ============================================================================
   BROWSER ANALYTICS ON /c/consult — OFF BY DEFAULT, ON ONLY BY NAMED OVERRIDE.

   The default for every client on this fleet is NO browser analytics tag of any
   kind on this page, and that default is not a style preference:

   - This page asks the visitor to select a Norwood or Ludwig stage and whether
     they have had a prior procedure. That is health-intent input in a form.
   - H-26 / §6 failure mode 7 make a browser analytics or advertising tag on a
     health-intent form page non-waivable at the skill layer, and these
     practices are BAA-covered.
   - Server-side delivery does not launder it either (H-32): the restriction
     follows the data, not the pipe.

   `CONSULT.ga4Id` is therefore null on every client unless Joe has directed
   otherwise for that specific client, in writing, with the direction recorded
   in that client's config file. §0 gives him that authority; this component
   exists so the override is a one-line, auditable config value rather than a
   quiet code edit, and so a client who has NOT been given it cannot inherit one
   by copy-paste. RHRLI's override (2026-08-14) is the only one on the fleet.

   When it IS set, this is built to the narrowest shape that still delivers it:

   - GA4 ONLY, loaded directly. NEVER a GTM container: the fleet's containers
     also carry DoubleClick remarketing and Microsoft Clarity session recording,
     and Clarity can read first-party form input. Restoring a container would
     ship three tags under cover of a request for one.
   - allow_google_signals: false. This is the load-bearing setting. It stops the
     visit being joined to a signed-in Google profile, which is what turns a
     page view into a remarketing audience member.
   - allow_ad_personalization_signals: false.
   - No field value is ever sent. No pattern, no prior_procedure, no name,
     phone or email reaches an event parameter, ever.
   - The step machine never changes the URL, so the automatic page_view cannot
     leak which step or which stage the visitor selected.
   ========================================================================== */
import Script from 'next/script'
import { useEffect } from 'react'
import { CONSULT } from '@/lib/consult.config'

/* No `declare global` here: Next ships its own Window.dataLayer type and a
   second declaration collides. A local cast keeps this file self-contained. */
type Gtag = (...args: unknown[]) => void
const win = () => (typeof window === 'undefined' ? null : (window as unknown as { gtag?: Gtag }))

export default function GaTag() {
  const id = CONSULT.ga4Id

  useEffect(() => {
    if (!id) return
    /* Belt and braces: if anything else on the page ever calls gtag('config'),
       these stay off for this measurement id. */
    const w = win()
    if (w && typeof w.gtag === 'function') {
      w.gtag('set', 'allow_google_signals', false)
      w.gtag('set', 'allow_ad_personalization_signals', false)
    }
  }, [id])

  /* Renders nothing at all when unset — not an empty container, not a stub. */
  if (!id) return null

  return (
    <>
      <Script
        id="ga4-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
      />
      <Script id="ga4-config" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('js', new Date());
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
gtag('config','${id}',{
  allow_google_signals:false,
  allow_ad_personalization_signals:false,
  anonymize_ip:true
});`}
      </Script>
    </>
  )
}
