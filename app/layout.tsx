import Script from 'next/script'
import DniSwap from '@/components/DniSwap'
import GaTag from '@/components/GaTag'
import Fab from '@/components/fab/Fab'
import './globals.css'

export const metadata = {
  // metadataBase is load-bearing, not boilerplate. Next.js resolves every
  // RELATIVE metadata URL against it, and with it unset the build falls back to
  // http://localhost:3000 — so the deployed pages served
  // <meta property="og:image" content="http://localhost:3000/images/pnw-logo.png">
  // to the public internet. Verified live 2026-08-25 on all three /c routes.
  // It fails silently and invisibly: the page renders perfectly, nothing errors,
  // and the defect lives only in a meta tag no human looks at (H-45).
  metadataBase: new URL('https://hair.pnwhairrestoration.com'),
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
