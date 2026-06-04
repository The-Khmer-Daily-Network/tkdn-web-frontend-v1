import { getNewsPath } from "@/utils/newsSlug";
import type { News } from "@/types/news";

export async function revalidateArticlePaths(paths: string[]): Promise<void> {
  const unique = Array.from(
    new Set(
      paths
        .map((p) => p.trim())
        .filter((p) => p.startsWith("/news/")),
    ),
  );
  if (unique.length === 0) return;

  try {
    await fetch("/api/admin/revalidate-article", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths: unique }),
    });
  } catch (error) {
    console.warn("Article cache revalidation failed:", error);
  }
}

export function getArticleRevalidatePaths(
  articleId: number,
  ...titles: Array<string | null | undefined>
): string[] {
  return titles
    .map((title) => {
      const trimmed = (title || "").trim();
      if (!trimmed) return null;
      return getNewsPath({ id: articleId, title: trimmed });
    })
    .filter((path): path is string => !!path);
}

export async function revalidateArticleAfterSave(
  articleId: number,
  options: { newTitle: string; previousTitle?: string | null },
): Promise<void> {
  const paths = getArticleRevalidatePaths(
    articleId,
    options.newTitle,
    options.previousTitle,
  );
  await revalidateArticlePaths(paths);
}

export async function revalidateArticleFromNews(
  news: Pick<News, "id" | "title">,
  previousTitle?: string | null,
): Promise<void> {
  await revalidateArticleAfterSave(news.id, {
    newTitle: news.title,
    previousTitle,
  });
}
