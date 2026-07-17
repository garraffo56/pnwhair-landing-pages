import type { Metadata } from 'next'
import PnwLP from '@/components/PnwLP'

export const metadata: Metadata = {
  title: 'Hair Loss Medical Evaluation | PNW Hair Restoration',
  robots: 'noindex, nofollow',
}

export default function Page() {
  return (
    <PnwLP
      heroFormId="XC7Ca2LMNHjFRQhxCDSw"
      bottomFormId="XpQZaPLquxe01bIZlqv5"
      h1="MEDICAL EVALUATION FOR THINNING HAIR & HAIR LOSS CONDITIONS"
      heroSub="Discover what causes hair loss and learn which treatment options fit each patient’s goals and hair biology."
    />
  )
}
