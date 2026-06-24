import type { ReactNode } from "react";
import type { News } from "@/types/news";
import {
  ARTICLE_BODY_HTML_CLASS,
  buildArticleImageNameMap,
  enrichArticleHtmlWithImageCaptions,
} from "@/utils/articleBodyHtml";
import { getCaptionText, normalizeImageUrlKey } from "@/utils/imageCaption";
import NewsPublishedMeta from "@/components/NewsPublishedMeta";

const CAPTION_CLASS = "text-sm text-gray-600 mt-2 italic";

function splitParagraphs(paragraph?: string) {
  const source = (paragraph || "").trim();
  if (!source) return [];
  if (/<[^>]+>/.test(source)) return [source];
  return source.split(/\n/).map((p) => p.trim()).filter(Boolean);
}

function toYouTubeEmbedUrl(url?: string | null) {
  const normalized = (url || "").trim();
  if (!normalized) return null;
  const withProtocol = /^https?:\/\//i.test(normalized)
    ? normalized
    : `https://${normalized.replace(/^\/+/, "")}`;

  const youtuBeMatch = withProtocol.match(/(?:youtu\.be\/)([^&\n?#]+)/);
  if (youtuBeMatch) {
    return `https://www.youtube.com/embed/${youtuBeMatch[1].split("&")[0].split("?")[0].trim()}`;
  }
  const watchMatch = withProtocol.match(/(?:youtube\.com\/watch\?v=)([^&\n?#]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1].split("&")[0].split("?")[0].trim()}`;
  }
  const embedMatch = withProtocol.match(/(?:youtube\.com\/embed\/)([^&\n?#]+)/);
  if (embedMatch) {
    return `https://www.youtube.com/embed/${embedMatch[1].split("&")[0].split("?")[0].trim()}`;
  }
  return withProtocol;
}

function isYouTubeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /youtube\.com|youtu\.be/i.test(url);
}

function getArticleInlineMediaFlags(news: News) {
  const endImageUrlKeys = new Set(
    (news.end_images || [])
      .map((img) => normalizeImageUrlKey(img?.url || ""))
      .filter((key) => key.length > 0),
  );

  const inlineImageUrls = (news.content_blocks || []).flatMap((block) =>
    Array.from(
      (block.paragraph || "").matchAll(/<img[^>]*src="([^"]+)"/gi),
      (m) => (m[1] || "").trim(),
    ),
  );

  const inlineVideoUrls = (news.content_blocks || []).flatMap((block) =>
    Array.from(
      (block.paragraph || "").matchAll(/<video[^>]*src="([^"]+)"/gi),
      (m) => (m[1] || "").trim(),
    ),
  );

  return {
    hasInlineNonEndImages: inlineImageUrls.some(
      (src) => !endImageUrlKeys.has(normalizeImageUrlKey(src)),
    ),
    hasInlineVideos: inlineVideoUrls.length > 0,
  };
}

/**
 * Server-rendered article HTML so Google can index title + body without waiting for client JS.
 * Matches the TKTN approach in Development/tktn-web-frontend-v2.
 */
export default function ServerNewsArticle({
  news,
  actions,
}: {
  news: News;
  /** Listen / Share — rendered under cover, above body (client island). */
  actions?: ReactNode;
}) {
  const publishedAt = news.date_time_post || news.created_at;
  const coverCaption = news.cover
    ? getCaptionText(news.cover_name, news.cover)
    : "";
  const { hasInlineNonEndImages, hasInlineVideos } = getArticleInlineMediaFlags(news);
  const inlineImageNameByUrl = buildArticleImageNameMap(news);
  const middleImageCaption = news.middle_image_url
    ? getCaptionText(news.middle_image_name, news.middle_image_url)
    : "";
  const middleVideoCaption = (news.middle_video_name || "").trim();

  return (
    <article className="w-full max-w-4xl mx-auto space-y-6 mt-6 article-content [&_a]:text-current [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-current">
      <header className="space-y-3">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-12 rounded-[10px] bg-[#E34C33]" />
          <div className="flex flex-col">
            {news.category?.name && (
              <p className="text-sm font-bold text-[#1D2229] uppercase">{news.category.name}</p>
            )}
            {publishedAt && (
              <NewsPublishedMeta
                publishedAt={publishedAt}
                author={news.author}
              />
            )}
            {!publishedAt && news.author && (
              <span className="text-sm text-gray-600">{news.author}</span>
            )}
          </div>
        </div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1D2229] leading-relaxed">
          {news.title}
        </h1>
        {news.subtitle && <p className="text-lg text-gray-700">{news.subtitle}</p>}
      </header>

      {news.cover && (
        <figure className="w-full">
          <img
            src={news.cover}
            alt={news.title}
            className="w-full h-auto object-cover rounded-lg aspect-[100/53]"
          />
          {coverCaption && (
            <figcaption className={CAPTION_CLASS}>{coverCaption}</figcaption>
          )}
        </figure>
      )}

      {actions}

      {Array.isArray(news.content_blocks) && news.content_blocks.length > 0 && (
        <div className="space-y-8">
          {news.content_blocks.map((block, idx) => (
            <section key={idx} className="space-y-4">
              {block.subtitle && (
                <h2 className="text-2xl font-bold text-[#1D2229]">{block.subtitle}</h2>
              )}
              {splitParagraphs(block.paragraph).map((paragraph, pIdx) => {
                const hasHtml = /<[^>]+>/.test(paragraph);
                if (hasHtml) {
                  const enrichedHtml = enrichArticleHtmlWithImageCaptions(
                    paragraph,
                    inlineImageNameByUrl,
                  );
                  return (
                    <div
                      key={pIdx}
                      className={ARTICLE_BODY_HTML_CLASS}
                      dangerouslySetInnerHTML={{ __html: enrichedHtml }}
                    />
                  );
                }
                return (
                  <p key={pIdx} className="text-base text-gray-800 leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
              {idx === 0 && news.middle_video_url && !hasInlineVideos && (
                <figure className="w-full my-8">
                  {isYouTubeUrl(news.middle_video_url) ? (
                    <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        src={toYouTubeEmbedUrl(news.middle_video_url) || undefined}
                        title={news.middle_video_name || news.title}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <video
                      src={news.middle_video_url}
                      controls
                      preload="metadata"
                      className="w-full h-auto rounded-lg aspect-video object-contain bg-gray-100"
                    />
                  )}
                  {middleVideoCaption && (
                    <figcaption className={CAPTION_CLASS}>{middleVideoCaption}</figcaption>
                  )}
                </figure>
              )}
              {idx === 0 &&
                !hasInlineNonEndImages &&
                !news.middle_video_url &&
                news.middle_image_url && (
                  <figure className="w-full my-8">
                    <img
                      src={news.middle_image_url}
                      alt={news.middle_image_name || news.title}
                      className="h-auto w-full object-cover rounded-lg aspect-[100/53]"
                    />
                    {middleImageCaption && (
                      <figcaption className={CAPTION_CLASS}>{middleImageCaption}</figcaption>
                    )}
                  </figure>
                )}
            </section>
          ))}
        </div>
      )}

      {Array.isArray(news.content_blocks) &&
        news.content_blocks.length === 0 &&
        news.subtitle && (
          <p className="text-base text-gray-800 leading-relaxed">{news.subtitle}</p>
        )}

      {Array.isArray(news.end_images) && news.end_images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {news.end_images.map((endImage, index) => {
            const endCaption = getCaptionText(endImage.name, endImage.url);
            return (
              <figure key={index} className="w-full">
                <img
                  src={endImage.url}
                  alt={endImage.name || `End image ${index + 1}`}
                  className="w-full h-auto object-cover rounded-lg"
                />
                {endCaption && (
                  <figcaption className={CAPTION_CLASS}>{endCaption}</figcaption>
                )}
              </figure>
            );
          })}
        </div>
      )}

    </article>
  );
}
