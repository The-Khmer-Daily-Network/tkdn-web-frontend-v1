import type { Metadata } from "next";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import ArticleJsonLd from "./ArticleJsonLd";
import NewsArticleActions from "./NewsArticleActions";
import NewsPageContent from "./NewsPageContent";
import ServerNewsArticle from "./ServerNewsArticle";
import BannerSponsor from "@/features/sponsor/bannerSponsor";
import { SITE_URL } from "@/config/site";
import { getApiBaseUrl, isApiConfigured } from "@/lib/api-url";
import { getFirstSentenceFromContent } from "@/utils/article";
import { getNewsIdFromSlugParam, getNewsPath, slugifyNewsTitle } from "@/utils/newsSlug";
import type { News } from "@/types/news";
import { articlePageFetchInit } from "@/utils/articlePageCache";

interface NewsMetadataModel {
  id?: number;
  title?: string;
  subtitle?: string | null;
  author?: string | null;
  cover?: string | null;
  created_at?: string;
  updated_at?: string;
  date_time_post?: string;
  content_blocks?: Array<{ subtitle?: string | null; paragraph?: string }> | null;
  category?: {
    name?: string;
  } | null;
}

const LIST_ROUTES = new Set(["latest", "video"]);

function isListRoute(idParam: string): boolean {
  return LIST_ROUTES.has(idParam.toLowerCase());
}

function getArticleOgImageUrl(idParam: string, baseUrl: string): string {
  return `${baseUrl}/api/news/${encodeURIComponent(idParam)}/og-image`;
}

async function fetchArticle(apiPath: string): Promise<NewsMetadataModel | null> {
  if (!isApiConfigured()) return null;

  try {
    const response = await fetch(`${getApiBaseUrl()}${apiPath}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...articlePageFetchInit(),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Error fetching news for SEO:", error);
    return null;
  }
}

const getNewsById = cache(async (id: number) => fetchArticle(`/news/${id}`));

const getNewsBySlug = cache(async (slug: string) => {
  if (!slug || !isApiConfigured()) return null;

  try {
    const response = await fetch(`${getApiBaseUrl()}/news`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...articlePageFetchInit(),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const articles: NewsMetadataModel[] = Array.isArray(data?.data) ? data.data : [];
  return (
    articles.find(
      (article) => slugifyNewsTitle(article?.title || "") === slug,
    ) || null
  );
  } catch {
    return null;
  }
});

function createMetaDescription(text: string, maxLength: number = 160): string {
  const stripped = text.replace(/<[^>]*>/g, "").trim();
  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength - 3) + "...";
}

function extractNewsKeywords(news: NewsMetadataModel): string[] {
  const keywords: string[] = [];
  if (news.title) keywords.push(news.title);
  if (news.subtitle) keywords.push(news.subtitle);
  if (news.category?.name) keywords.push(news.category.name);
  if (news.author) keywords.push(news.author);
  return keywords.filter(Boolean);
}

function resolveArticleImageUrl(baseUrl: string, news: NewsMetadataModel): string {
  let imageUrl = `${baseUrl}/assets/TKDN_Logo/TKDN_Logo_Square.png`;
  if (news.cover) {
    if (news.cover.startsWith("http://") || news.cover.startsWith("https://")) {
      imageUrl = news.cover;
    } else if (news.cover.startsWith("/")) {
      imageUrl = `${baseUrl}${news.cover}`;
    } else {
      imageUrl = `${baseUrl}/${news.cover}`;
    }
  }
  return imageUrl;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: idParam } = await params;

  if (!isApiConfigured()) {
    return {
      title: "The Khmer Daily Network - Latest News, Articles & Videos",
      description:
        "The Khmer Daily Network is your trusted source for the latest news, articles, and videos from Cambodia.",
    };
  }

  const resolvedId = getNewsIdFromSlugParam(idParam);
  const news = resolvedId
    ? await getNewsById(resolvedId)
    : await getNewsBySlug(idParam);

  if (news) {
    const baseUrl = SITE_URL;
    const imageUrl = getArticleOgImageUrl(idParam, baseUrl);
    const title = `${news.title} - The Khmer Daily Network`;
    const url = resolvedId
      ? `${baseUrl}${getNewsPath({ id: resolvedId, title: news.title || "" })}`
      : `${baseUrl}/news/${idParam}`;

    const descriptionFallback =
      getFirstSentenceFromContent(news.content_blocks) || news.title || "";
    const description = createMetaDescription(
      news.subtitle || descriptionFallback,
      160,
    );

    const newsKeywords = extractNewsKeywords(news);
    const allKeywords = [
      ...newsKeywords,
      "The Khmer Daily Network",
      "TKDN",
      "Cambodia news",
      "Khmer news",
      "latest news",
      "breaking news",
      "Cambodian news",
    ].filter(Boolean);

    const publishedTime = news.date_time_post || news.created_at || "";
    const modifiedTime =
      news.updated_at || news.date_time_post || news.created_at || "";

    return {
      title: { absolute: title },
      description,
      keywords: allKeywords.join(", "),
      authors: [{ name: news.author || "The Khmer Daily Network" }],
      creator: news.author || "The Khmer Daily Network",
      publisher: "The Khmer Daily Network",
      robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
          index: true,
          follow: true,
          noimageindex: false,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
      openGraph: {
        type: "article",
        locale: "en_US",
        alternateLocale: ["km_KH"],
        title,
        description,
        url,
        siteName: "The Khmer Daily Network",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: news.title,
          },
        ],
        publishedTime: publishedTime || undefined,
        modifiedTime: modifiedTime || undefined,
        authors: [news.author || "The Khmer Daily Network"],
        ...(news.category && {
          section: news.category.name,
          tags: [news.category.name, ...newsKeywords],
        }),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
        site: "@TheKhmerDaily",
        creator: "@TheKhmerDaily",
      },
      alternates: {
        canonical: url,
        languages: {
          km: url,
          en: url,
        },
      },
      other: {
        news_keywords: newsKeywords.slice(0, 10).join(", "),
        "original-source": url,
        "syndication-source": url,
        "article:published_time": publishedTime,
        "article:modified_time": modifiedTime,
        "article:author": news.author || "The Khmer Daily Network",
        "article:publisher": "https://www.facebook.com/TheKhmerDailyNetwork",
        ...(news.category && {
          "article:section": news.category.name,
          "article:tag": news.category.name,
        }),
        date: publishedTime,
        "last-modified": modifiedTime,
        "google-site-verification":
          process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
      },
    };
  }

  const baseUrl = SITE_URL;

  if (idParam?.toLowerCase() === "latest") {
    return {
      title: "Latest News - The Khmer Daily Network",
      description:
        "Stay updated with the latest breaking news, current events, and stories from Cambodia and around the world on The Khmer Daily Network.",
      keywords:
        "latest news, breaking news, Cambodia news, Khmer news, current events, TKDN",
      openGraph: {
        type: "website",
        title: "Latest News - The Khmer Daily Network",
        description: "Stay updated with the latest breaking news from Cambodia",
        siteName: "The Khmer Daily Network",
        url: `${baseUrl}/news/latest`,
        images: [
          {
            url: `${baseUrl}/assets/TKDN_Logo/TKDN_Logo_Square.png`,
            width: 1200,
            height: 1200,
            alt: "The Khmer Daily Network",
          },
        ],
      },
      robots: { index: true, follow: true },
      alternates: { canonical: `${baseUrl}/news/latest` },
    };
  }

  if (idParam?.toLowerCase() === "video") {
    return {
      title: "News Videos - The Khmer Daily Network",
      description:
        "Watch the latest news videos and video reports from Cambodia on The Khmer Daily Network.",
      keywords:
        "news videos, video news, Cambodia videos, Khmer videos, TKDN videos",
      openGraph: {
        type: "website",
        title: "News Videos - The Khmer Daily Network",
        description: "Watch the latest news videos from Cambodia",
        siteName: "The Khmer Daily Network",
        url: `${baseUrl}/news/video`,
        images: [
          {
            url: `${baseUrl}/assets/TKDN_Logo/TKDN_Logo_Square.png`,
            width: 1200,
            height: 1200,
            alt: "The Khmer Daily Network",
          },
        ],
      },
      robots: { index: true, follow: true },
      alternates: { canonical: `${baseUrl}/news/video` },
    };
  }

  return {
    title: "The Khmer Daily Network - Cambodia News & Updates",
    description:
      "The Khmer Daily Network is your trusted source for the latest news, articles, and videos from Cambodia.",
    openGraph: {
      type: "website",
      siteName: "The Khmer Daily Network",
      images: [
        {
          url: `${baseUrl}/assets/TKDN_Logo/TKDN_Logo_Square.png`,
          width: 1200,
          height: 1200,
          alt: "The Khmer Daily Network Logo",
        },
      ],
    },
    robots: { index: true, follow: true },
  };
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;

  if (isListRoute(idParam)) {
    return <NewsPageContent key={idParam} />;
  }

  const resolvedId = getNewsIdFromSlugParam(idParam);

  if (resolvedId) {
    const news = await getNewsById(resolvedId);
    if (!news) notFound();

    const initialNewsData = news as News;
    const canonicalPath = getNewsPath(initialNewsData);
    if (idParam !== canonicalPath.replace("/news/", "")) {
      redirect(canonicalPath);
    }

    const imageUrl = resolveArticleImageUrl(SITE_URL, initialNewsData);

    return (
      <>
        <ArticleJsonLd
          news={initialNewsData}
          siteBase={SITE_URL}
          imageUrl={imageUrl}
        />
        <BannerSponsor />
        <ServerNewsArticle
          news={initialNewsData}
          actions={<NewsArticleActions news={initialNewsData} />}
        />
      </>
    );
  }

  return <NewsPageContent key={idParam} />;
}
