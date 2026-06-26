import { SITE_URL } from "@/config/site";
import { getApiBaseUrl, isApiConfigured } from "@/lib/api-url";
import { getNewsIdFromSlugParam } from "@/utils/newsSlug";

const DEFAULT_IMAGE = `${SITE_URL}/assets/TKDN_Logo/TKDN_Logo_Square.png`;

type NewsMeta = {
  cover?: string | null;
};

function toAbsoluteUrl(url?: string | null): string {
  if (!url) return DEFAULT_IMAGE;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${SITE_URL}${url}`;
  return `${SITE_URL}/${url}`;
}

async function fetchNewsCover(idParam: string): Promise<string> {
  const articleId = getNewsIdFromSlugParam(idParam);
  if (!articleId || !isApiConfigured()) return DEFAULT_IMAGE;

  const apiBase = getApiBaseUrl();

  try {
    const response = await fetch(`${apiBase}/news/${articleId}`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) return DEFAULT_IMAGE;

    const payload = (await response.json()) as {
      success?: boolean;
      data?: NewsMeta;
    };
    if (!payload.success || !payload.data) return DEFAULT_IMAGE;

    return toAbsoluteUrl(payload.data.cover);
  } catch {
    return DEFAULT_IMAGE;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const imageUrl = await fetchNewsCover(id);

  try {
    const imageResponse = await fetch(imageUrl, { cache: "no-store" });
    if (!imageResponse.ok) {
      return Response.redirect(DEFAULT_IMAGE, 302);
    }

    const bytes = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch {
    return Response.redirect(DEFAULT_IMAGE, 302);
  }
}
