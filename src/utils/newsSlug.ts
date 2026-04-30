import type { News } from "@/types/news";

export function slugifyNewsTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getNewsSlug(news: Pick<News, "title">): string {
  const slug = slugifyNewsTitle(news.title || "");
  return slug || "article";
}

export function getNewsPath(news: Pick<News, "title">): string {
  return `/news/${getNewsSlug(news)}`;
}
