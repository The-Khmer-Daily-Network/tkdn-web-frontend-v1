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

type NewsSlugInput = Pick<News, "title"> & Partial<Pick<News, "id">>;

export function getNewsSlug(news: NewsSlugInput): string {
  const slug = slugifyNewsTitle(news.title || "") || "article";
  if (typeof news.id === "number" && Number.isFinite(news.id)) {
    return `${slug}-${news.id}`;
  }
  return slug;
}

export function getNewsPath(news: NewsSlugInput): string {
  return `/news/${getNewsSlug(news)}`;
}

export function getNewsIdFromSlugParam(param: string): number | null {
  const value = (param || "").trim();
  if (!value) return null;
  const exactNumeric = Number(value);
  if (Number.isInteger(exactNumeric) && exactNumeric > 0) {
    return exactNumeric;
  }
  const match = value.match(/-(\d+)$/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
