'use client'
import Script from 'next/script'
import { usePathname } from 'next/navigation'

/* GA4 ONLY. GTM-W9LDWCQ7 was removed from this landing page app on 2026-08-15 at
   Joe's direction. Measured live that day it delivered Microsoft Clarity session
   recording, the Meta pixel, Bing UET and a DoubleClick view-through remarketing
   beacon onto patient-intake pages. Neither Microsoft nor Meta will sign a BAA.

   The container itself was NOT edited, and must not be: PNW Hair's own website
   serves the same container, so editing it would strip that site's own analytics
   and retargeting. Scope is the landing page fleet only.

   allow_google_signals:false is load-bearing. Without it, GA4 linked to Google Ads
   keeps building the same remarketing audiences off the same page views and
   removing the beacon achieves nothing (H-32). */
const GA_ID = 'G-D9ZKP1B4XZ'


/* HEALTH-INTENT ROUTE GATE — added 2026-08-17 with the /c/consult build.

   /c/consult collects a name, email, mobile, a Norwood/Ludwig selection and a
   prior-procedure answer. That is health-intent input in a form, and H-26 /
   §6 failure mode 7 make a browser analytics tag on such a page non-waivable
   at the skill layer; these practices are BAA-covered and Google will not sign
   one for GA4. Server-side delivery would not launder it either (H-32) — the
   restriction follows the data, not the pipe.

   WIDENED 2026-08-24 TO THE WHOLE /c PREFIX, on Joe's explicit call. The
   narrow /c/consult scope below was flagged in this comment as needing that
   decision, and the finding that forced it: PNW's live money campaign
   (23741108566, $140/day) sends 100% of its paid clicks to /c/hair-restoration
   and /c/hair-loss-treatment, both of which mount a GHL consult form and both
   of which were firing GA4. Every /c route in this app mounts a form
   (hair-restoration, hair-loss-treatment, evaluation, consult, thank-you), so
   the prefix and the health-intent set are the same set. Gating the prefix
   rather than listing routes is deliberate: a route gate written against the
   routes that existed the day it was written goes silently wrong the moment a
   route is added (H-45), which is exactly what happened here.

   Only /cookie-policy and /privacy-policy still receive the tag. / redirects
   to /c/evaluation.

   Suppressing a tag on a medical page can only ever reduce exposure, so this
   edit cannot hide a violation. Widening it back is a separate decision and
   belongs to Joe.

   */
const HEALTH_INTENT_ROUTES = ['/c']
const isHealthIntent = (p: string) =>
  HEALTH_INTENT_ROUTES.some((r) => p === r || p.startsWith(r + '/'))

export default function GaTag() {
  const pathname = usePathname() || ''
  if (isHealthIntent(pathname)) return null

  return (
    <>
      <Script
        id="ga4-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script id="ga4-config" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
gtag('js', new Date());
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
gtag('config','${GA_ID}',{allow_google_signals:false,allow_ad_personalization_signals:false,anonymize_ip:true});`}
      </Script>
    </>
  )
}
