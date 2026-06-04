const ARTICLE_PAGE_REVALIDATE_SECONDS = 60;

/** Fetch options for article API calls (no-store in dev; ISR in production). */
export function articlePageFetchInit(): RequestInit {
  if (process.env.NODE_ENV === "development") {
    return { cache: "no-store" };
  }
  return { next: { revalidate: ARTICLE_PAGE_REVALIDATE_SECONDS } };
}
