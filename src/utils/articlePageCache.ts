/** ISR window for public article pages (seconds). Shorter in dev so edits show up immediately. */
export const ARTICLE_PAGE_REVALIDATE_SECONDS =
  process.env.NODE_ENV === "development" ? 0 : 300;

export function articlePageFetchInit(): RequestInit {
  if (process.env.NODE_ENV === "development") {
    return { cache: "no-store" };
  }
  return { next: { revalidate: ARTICLE_PAGE_REVALIDATE_SECONDS } };
}
