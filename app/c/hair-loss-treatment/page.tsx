import type { Metadata } from 'next'
import PnwLP from '@/components/PnwLP'

export const metadata: Metadata = {
  title: 'Hair Loss Treatment Options | PNW Hair Restoration',
  robots: 'noindex, nofollow',
}

export default function Page() {
  return (
    <PnwLP
      heroFormId="XC7Ca2LMNHjFRQhxCDSw"
      bottomFormId="XpQZaPLquxe01bIZlqv5"
      h1="HAIR LOSS TREATMENT PLANNING, LED BY A PHYSICIAN"
      heroSub="An evaluation-first approach: understand the cause, then review medically appropriate treatment options."
    />
  )
}
