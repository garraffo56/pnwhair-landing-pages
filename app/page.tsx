import { redirect } from 'next/navigation'

// The bare domain is a redirect stub, but it is still a reachable ad
// destination. A redirect that drops the query string strips gclid/UTMs before
// the landing page's GhlForm can read them, so the lead reaches GHL with an
// empty Gclid-Of field and the click is invisible to offline conversions
// (H-27). Carry the whole query through verbatim.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, v))
    else if (value !== undefined) qs.append(key, value)
  }
  const query = qs.toString()
  redirect(query ? `/c/evaluation?${query}` : '/c/evaluation')
}
