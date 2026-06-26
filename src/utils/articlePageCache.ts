/** SEO-critical article fetches always bypass Next.js data cache (matches TKTN). */
export function articlePageFetchInit(): RequestInit {
  return { cache: "no-store" };
}
