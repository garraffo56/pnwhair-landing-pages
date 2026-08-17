import { CONSULT } from '@/lib/consult.config'

/* Practice wordmark for the consult masthead.

   Two shapes, chosen by config, because the fleet genuinely has both:

   - `wordmarkSrc` — a real logo asset already in that repo's public/. Rendered
     as an <img>. Note the trap this replaces: an inline SVG whose paths carry
     fill="var(--fill-0, white)" always renders white, because CSS variables do
     not cross into an image's own document; and a root with
     preserveAspectRatio="none" plus percentage width/height has no intrinsic
     ratio and stretches vertically to fill whatever box it lands in. If you
     ever inline an SVG here, set fill="currentColor" and keep the viewBox.

   - no asset — a text wordmark in the practice name, which is what the fleet
     image doctrine already specifies when no logo file exists. This is not a
     placeholder to be replaced later; it is a legitimate treatment. It is also
     the honest option: rendering a sibling client's logo, or a stock mark, is
     a misrepresentation of the practice. */
export default function Wordmark({ className }: { className?: string }) {
  if (CONSULT.wordmarkSrc) {
    return (
      <img
        className={className}
        src={CONSULT.wordmarkSrc}
        alt={CONSULT.practice}
        height={28}
        decoding="async"
      />
    )
  }
  return (
    <span className={className} data-wordmark-text="" role="img" aria-label={CONSULT.practice}>
      {CONSULT.wordmarkText || CONSULT.practice}
    </span>
  )
}
