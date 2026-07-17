import type { Metadata } from 'next'
import PnwLP from '@/components/PnwLP'

export const metadata: Metadata = {
  title: 'Hair Restoration | PNW Hair Restoration',
  robots: 'noindex, nofollow',
}

export default function Page() {
  return (
    <PnwLP
      heroFormId="XC7Ca2LMNHjFRQhxCDSw"
      bottomFormId="XpQZaPLquxe01bIZlqv5"
      h1="HAIR RESTORATION GUIDED BY A BOARD-CERTIFIED PHYSICIAN"
      heroSub="Doctor-led evaluation and personalized treatment planning for thinning hair, in a regulated clinical setting."
    />
  )
}
