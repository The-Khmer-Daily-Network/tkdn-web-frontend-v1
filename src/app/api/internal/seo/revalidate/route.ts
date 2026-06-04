import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface RevalidateRequestBody {
  paths?: string[];
}

function normalizePaths(paths: unknown): string[] {
  if (!Array.isArray(paths)) {
    return [];
  }

  return paths
    .filter((path): path is string => typeof path === "string")
    .map((path) => path.trim())
    .filter((path) => path.startsWith("/") && path.length <= 500);
}

export async function POST(request: Request) {
  const expectedToken = process.env.SEO_REVALIDATE_TOKEN;
  const requestToken = request.headers.get("x-seo-revalidate-token");

  if (!expectedToken || requestToken !== expectedToken) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let payload: RevalidateRequestBody = {};
  try {
    payload = (await request.json()) as RevalidateRequestBody;
  } catch {
    payload = {};
  }

  const dynamicPaths = normalizePaths(payload.paths);
  const pathsToRevalidate = Array.from(
    new Set([
      ...dynamicPaths,
      "/sitemap.xml",
      "/news-sitemap.xml",
    ]),
  );

  for (const path of pathsToRevalidate) {
    revalidatePath(path, "page");
  }

  revalidatePath("/home", "page");
  revalidatePath("/news/latest", "page");

  return NextResponse.json({
    success: true,
    revalidated: pathsToRevalidate,
  });
}
