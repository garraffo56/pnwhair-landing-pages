import type { Metadata } from 'next'
import PnwLP from '@/components/PnwLP'

export const metadata: Metadata = {
  // No trademark symbol in the title, per the ARTAS naming policy. noindex
  // matches every other /c route: these are paid-traffic pages, not organic ones,
  // and the client's own site owns the indexable ARTAS page.
  title: 'ARTAS iX Robotic Hair Restoration | PNW Hair Restoration',
  robots: 'noindex, nofollow',
}

export default function Page() {
  return (
    <PnwLP
      heroFormId="XC7Ca2LMNHjFRQhxCDSw"
      bottomFormId="XpQZaPLquxe01bIZlqv5"
      h1="ROBOTIC HAIR RESTORATION WITH THE ARTAS iX"
      heroSub="Physician-directed robotic follicular unit extraction, planned around a medical evaluation with Dr. Higgins."
      heroImage="/images/artas-ix-mapping.png"
      heroImageAlt="The ARTAS iX robotic hair restoration system with a digital map of the donor area on its console"
      showArtas
    />
  )
}
