import Script from 'next/script'
import DniSwap from '@/components/DniSwap'
import GaTag from '@/components/GaTag'
import Fab from '@/components/fab/Fab'
import './globals.css'

export const metadata = {
  openGraph: {
    images: [{ url: '/images/pnw-logo.png', width: 1016, height: 239, alt: 'PNW Hair Restoration' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Meta pixel removed 2026-08-15, same change and same reason as the GTM
            container: it fired on landing pages that collect patient contact details
            and hair-loss intent, and Meta will not sign a BAA. */}
</head>
      <body>
          <GaTag />
        <Fab client="pnw" />
        <DniSwap />
        {children}
      </body>
    </html>
  )
}
