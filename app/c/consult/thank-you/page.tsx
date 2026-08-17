import type { Metadata } from 'next'
import Wordmark from '@/components/consult/Wordmark'
import GaTag from '@/components/consult/GaTag'
import BookingSummary from '@/components/consult/BookingSummary'
import { CONSULT } from '@/lib/consult.config'
import '../consult.css'
import '../theme.css'
import './thanks.css'

/* ============================================================================
   CONSULT CONFIRMATION — SHARED ENGINE. IDENTICAL IN EVERY LP-FLEET REPO.

   HARD: no Meta pixel on this page, ever. Post-conversion is when the health
   fact becomes certain — this is the worst page for a pixel, not the safest,
   and CAPI does not launder it (H-32). GaTag stays off unless that client's
   config carries a named override.
   ========================================================================== */

export const metadata: Metadata = {
  title: `You're booked | ${CONSULT.practice}`,
  robots: { index: false, follow: false },
}

/* Posts are read live from the practice's own site rather than curated here, so
   the list cannot go stale or misattribute a title. Revalidated hourly. A
   failed read renders nothing at all: an empty list and an unreachable API are
   different claims, and inventing filler for either is how a wrong fact ships. */
type Post = { id: number; link: string; date: string; title: { rendered: string } }

async function recentPosts(): Promise<Post[]> {
  if (!CONSULT.postsApi) return []
  try {
    const res = await fetch(CONSULT.postsApi, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? (data as Post[]) : []
  } catch {
    return []
  }
}

const decode = (s: string) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
   .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
   .replace(/&#8217;|&rsquo;/g, '’').replace(/&#8216;|&lsquo;/g, '‘')

export default async function ThankYou() {
  const posts = await recentPosts()

  return (
    <div id="consult">
      <GaTag />

      <header className="masthead">
        <a className="mark" href={CONSULT.siteUrl} aria-label={CONSULT.practice}>
          <Wordmark className="wordmark" />
        </a>
        <div className="mast-meta">
          <a className="tel" href={`tel:${CONSULT.phoneRaw}`}>{CONSULT.phoneDisplay}</a>
        </div>
      </header>

      <main className="thanks">
        <section className="thanks-head">
          <h1 className="statement">You&apos;re booked.</h1>
          <BookingSummary address={CONSULT.address} city={CONSULT.city} />
        </section>

        {/* ---------------------------------------------------------------
            WHAT TO EXPECT — INTENTIONALLY EMPTY.

            The practice has to write this. Describing a consultation we have
            not been told the shape of is exactly how an "instrument reading"
            a practice does not offer ended up on a live page on 2026-08-14.
            Replace this block with their words, then delete the notice.
            --------------------------------------------------------------- */}
        <section className="tsec" data-awaiting-copy>
          <h2>What to expect</h2>
          <p className="tsec-empty">
            Awaiting copy from the practice. This section stays empty until
            {' '}{CONSULT.practice} describes the consultation in their own words.
          </p>
        </section>

        {/* ---------------------------------------------------------------
            TESTIMONIALS — INTENTIONALLY EMPTY.

            Needs real, attributable, release-covered patient words. Not
            writable here, and Google review text needs a working Places key
            plus Google's attribution requirements honoured.
            --------------------------------------------------------------- */}
        <section className="tsec" data-awaiting-copy>
          <h2>What patients say</h2>
          <p className="tsec-empty">
            Awaiting real testimonials with marketing releases on file.
          </p>
        </section>

        {posts.length > 0 && (
          <section className="tsec">
            <h2>While you wait</h2>
            <ul className="posts">
              {posts.map((p) => (
                <li key={p.id}>
                  <a href={p.link}>
                    <span className="pt">{decode(p.title.rendered)}</span>
                    <time dateTime={p.date}>
                      {new Date(p.date).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric',
                      })}
                    </time>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="callnote">
          <p>Need to change it, or have a question first?</p>
          <a href={`tel:${CONSULT.phoneRaw}`}>
            <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M5.2 2.6 7 6l-1.7 1.6a10 10 0 0 0 5.1 5.1L12 11l3.4 1.8v3a1.6 1.6 0 0 1-1.8 1.6C7.3 16.9 1.1 10.7.6 4.4A1.6 1.6 0 0 1 2.2 2.6h3Z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            {CONSULT.phoneDisplay}
          </a>
        </div>
      </main>

      <footer className="consult-footer">
        <p className="cf-name">{CONSULT.practice}</p>
        <p className="cf-line">{CONSULT.address}, {CONSULT.city} &nbsp;·&nbsp; <a href={`tel:${CONSULT.phoneRaw}`}>{CONSULT.phoneDisplay}</a></p>
        <p className="cf-disc">
          Individual results vary. This content is for educational purposes only and is not medical
          advice. Consult a qualified physician before pursuing any medical procedure.
        </p>
        <nav className="cf-links">
          <span>© {new Date().getFullYear()} {CONSULT.practice}</span>
          <a href={CONSULT.privacyUrl}>Privacy Policy</a>
          <a href={CONSULT.cookieUrl}>Cookie Policy</a>
          {CONSULT.termsUrl && <a href={CONSULT.termsUrl}>Terms of Service</a>}
        </nav>
      </footer>
    </div>
  )
}
