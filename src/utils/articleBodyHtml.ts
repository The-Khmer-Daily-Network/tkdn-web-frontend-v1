import type { News } from "@/types/news";
import {
  getCaptionText,
  getImageCaptionFallback,
  normalizeImageUrlKey,
} from "@/utils/imageCaption";

const GENERIC_CAPTIONS = new Set(["inline image", "article image"]);

const IMG_WITH_OPTIONAL_CAPTION =
  /<img\b([^>]*?)\s*\/?>(\s*<i\b[^>]*\bdata-img-caption=["']true["'][^>]*>[\s\S]*?<\/i>)?/gi;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getHtmlAttr(attrs: string, name: string): string {
  const match = attrs.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"));
  return (match?.[1] || "").trim();
}

function resolveImgCaption(
  src: string,
  attrs: string,
  imageNameByUrl: Map<string, string>,
): string {
  if (!src) return "";
  const srcKey = normalizeImageUrlKey(src);
  const mapped = srcKey ? imageNameByUrl.get(srcKey) : undefined;
  const title = getHtmlAttr(attrs, "title");
  const alt = getHtmlAttr(attrs, "alt");
  const preferred = mapped || title || alt;
  const caption = getCaptionText(preferred, src);
  if (!caption || GENERIC_CAPTIONS.has(caption.toLowerCase())) {
    const fallbackOnly = getImageCaptionFallback(src);
    if (!fallbackOnly || GENERIC_CAPTIONS.has(fallbackOnly.toLowerCase())) {
      return "";
    }
    return fallbackOnly;
  }
  return caption;
}

/** Map image basename → caption from middle/end fields (and cover if needed later). */
export function buildArticleImageNameMap(news: News): Map<string, string> {
  const map = new Map<string, string>();

  if (news.middle_image_url) {
    const name = getCaptionText(news.middle_image_name, news.middle_image_url);
    const key = normalizeImageUrlKey(news.middle_image_url);
    if (name && key) map.set(key, name);
  }

  for (const endImage of news.end_images || []) {
    if (!endImage?.url) continue;
    const name = getCaptionText(endImage.name, endImage.url);
    const key = normalizeImageUrlKey(endImage.url);
    if (name && key) map.set(key, name);
  }

  return map;
}

/** Inject visible captions after inline <img> tags (server-safe, no DOMParser). */
export function enrichArticleHtmlWithImageCaptions(
  html: string,
  imageNameByUrl: Map<string, string>,
): string {
  if (!html?.trim()) return html;

  return html.replace(IMG_WITH_OPTIONAL_CAPTION, (full, attrs, existingCaption) => {
    if (existingCaption) return full;
    const src = getHtmlAttr(attrs, "src");
    const caption = resolveImgCaption(src, attrs, imageNameByUrl);
    if (!caption) return full;
    return `${full}<i data-img-caption="true">${escapeHtml(caption)}</i>`;
  });
}

/** Shared Tailwind selectors for CMS HTML rendered on public article pages. */
export const ARTICLE_BODY_BLOCKQUOTE_CLASS =
  "[&_blockquote]:relative [&_blockquote]:my-4 [&_blockquote]:py-1 [&_blockquote]:px-8 [&_blockquote]:text-xl [&_blockquote]:md:text-2xl [&_blockquote]:font-bold [&_blockquote]:italic [&_blockquote]:text-current [&_blockquote]:leading-relaxed [&_blockquote]:text-left [&_blockquote]:before:absolute [&_blockquote]:before:-left-1 [&_blockquote]:before:top-0 [&_blockquote]:before:font-serif [&_blockquote]:before:font-bold [&_blockquote]:before:not-italic [&_blockquote]:before:text-[48px] [&_blockquote]:before:md:text-[60px] [&_blockquote]:before:leading-none [&_blockquote]:before:text-current [&_blockquote]:before:content-['“'] [&_blockquote]:after:absolute [&_blockquote]:after:-right-1 [&_blockquote]:after:-bottom-6 [&_blockquote]:after:font-serif [&_blockquote]:after:font-bold [&_blockquote]:after:not-italic [&_blockquote]:after:text-[48px] [&_blockquote]:after:md:text-[60px] [&_blockquote]:after:leading-none [&_blockquote]:after:text-current [&_blockquote]:after:content-['”']";

export const ARTICLE_BODY_HTML_CLASS = [
  "text-base text-gray-800 leading-relaxed break-words",
  "[&_a]:text-current [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-current [&_a]:break-words",
  "[&_p]:mb-4 [&_p:last-child]:mb-0",
  "[&_b]:font-bold [&_strong]:font-bold",
  "[&_h2]:my-2 [&_h2]:text-xl [&_h2]:md:text-2xl [&_h2]:font-bold [&_h2]:leading-snug",
  "[&_img]:my-4 [&_img]:w-full [&_img]:aspect-[100/53] [&_img]:h-auto [&_img]:rounded-lg [&_img]:object-cover",
  "[&_img+_i]:-mt-1 [&_img+_i]:mb-3 [&_img+_i]:block [&_img+_i]:text-sm [&_img+_i]:italic [&_img+_i]:text-gray-600",
  ARTICLE_BODY_BLOCKQUOTE_CLASS,
].join(" ");
