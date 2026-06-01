import { categoryNameToSlug } from "@/utils/slug";
import { getFirstSentenceFromContent } from "@/utils/article";
import { getNewsPath } from "@/utils/newsSlug";
import type { News } from "@/types/news";

type ArticleForJsonLd = Pick<
  News,
  | "id"
  | "title"
  | "subtitle"
  | "cover"
  | "author"
  | "category"
  | "date_time_post"
  | "created_at"
  | "updated_at"
  | "middle_video_url"
  | "middle_video_name"
  | "content_blocks"
>;

function getYouTubeThumbnail(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&\n?#]+)/,
  );
  return match
    ? `https://img.youtube.com/vi/${match[1].split("&")[0].trim()}/maxresdefault.jpg`
    : null;
}

function isYouTubeUrl(url: string | null): boolean {
  return !!url && /youtube\.com|youtu\.be/.test(url);
}

export default function ArticleJsonLd({
  news,
  siteBase,
  imageUrl,
}: {
  news: ArticleForJsonLd;
  siteBase: string;
  imageUrl: string;
}) {
  const articleUrl = `${siteBase}${getNewsPath(news)}`;
  const descriptionFallback =
    getFirstSentenceFromContent(news.content_blocks) || news.title;
  const description = news.subtitle || descriptionFallback;

  const newsArticleSchema = {
    "@type": "NewsArticle",
    headline: news.title,
    description,
    keywords: [
      news.title,
      description,
      news.category?.name,
      "The Khmer Daily Network",
      "Cambodia news",
      "Khmer news",
    ]
      .filter(Boolean)
      .join(", "),
    image: imageUrl,
    datePublished: news.date_time_post || news.created_at,
    dateModified: news.updated_at || news.date_time_post || news.created_at,
    author: {
      "@type": "Person" as const,
      name: news.author || "The Khmer Daily Network",
    },
    publisher: {
      "@type": "Organization" as const,
      name: "The Khmer Daily Network",
      logo: {
        "@type": "ImageObject" as const,
        url: `${siteBase}/assets/TKDN_Logo/TKDN_Logo_Square.png`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage" as const, "@id": articleUrl },
    ...(news.category && { articleSection: news.category.name }),
  };

  const breadcrumbItems = [
    { "@type": "ListItem" as const, position: 1, name: "Home", item: siteBase },
    ...(news.category
      ? [
          {
            "@type": "ListItem" as const,
            position: 2,
            name: news.category.name,
            item: `${siteBase}/${categoryNameToSlug(news.category.name)}`,
          },
          {
            "@type": "ListItem" as const,
            position: 3,
            name: news.title,
            item: articleUrl,
          },
        ]
      : [
          {
            "@type": "ListItem" as const,
            position: 2,
            name: news.title,
            item: articleUrl,
          },
        ]),
  ];

  const videoSchema = news.middle_video_url
    ? {
        "@type": "VideoObject" as const,
        name: news.middle_video_name || news.title,
        description,
        thumbnailUrl: getYouTubeThumbnail(news.middle_video_url) || imageUrl,
        uploadDate: news.date_time_post || news.created_at,
        ...(isYouTubeUrl(news.middle_video_url)
          ? { embedUrl: news.middle_video_url }
          : { contentUrl: news.middle_video_url }),
        publisher: {
          "@type": "Organization" as const,
          name: "The Khmer Daily Network",
          logo: {
            "@type": "ImageObject" as const,
            url: `${siteBase}/assets/TKDN_Logo/TKDN_Logo_Square.png`,
          },
        },
      }
    : null;

  const graph = [
    newsArticleSchema,
    { "@type": "BreadcrumbList" as const, itemListElement: breadcrumbItems },
    ...(videoSchema ? [videoSchema] : []),
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
