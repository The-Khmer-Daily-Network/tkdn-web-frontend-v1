const PROXY_PATH = "/api-proxy";

/**
 * True when either a direct API base URL is set, or same-origin proxy mode is enabled.
 */
export function isApiConfigured(): boolean {
  return (
    process.env.NEXT_PUBLIC_API_PROXY === "1" ||
    Boolean(process.env.NEXT_PUBLIC_API_BASE_URL?.trim())
  );
}

function getServerDirectApiBaseUrl(): string {
  const upstream = (
    process.env.API_UPSTREAM_ORIGIN ??
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/?$/, "") ??
    "https://api.thekhmerdailynetwork.com"
  ).replace(/\/$/, "");
  return `${upstream}/api`;
}

/**
 * Base URL for API calls (includes `/api` segment for direct mode, or `/api-proxy` in proxy mode).
 * When `NEXT_PUBLIC_API_PROXY=1`, the browser calls same-origin `/api-proxy/...` and Next.js rewrites
 * to the real API so CORS does not apply. Server-side fetch calls the upstream API directly (not via
 * VERCEL_URL self-proxy), which breaks on production when SSR fetches its own deployment host.
 */
export function getApiBaseUrl(): string {
  const useProxy = process.env.NEXT_PUBLIC_API_PROXY === "1";

  if (useProxy) {
    if (typeof window !== "undefined") {
      return PROXY_PATH;
    }
    return getServerDirectApiBaseUrl();
  }

  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not defined. Set it to your API base (e.g. https://api.example.com/api), or set NEXT_PUBLIC_API_PROXY=1 to use the same-origin proxy (see next.config rewrites).",
    );
  }
  return base;
}

export function getApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  const apiPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${apiPath}`;
}
