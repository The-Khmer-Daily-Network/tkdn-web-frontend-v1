import type { Metadata } from "next";
import NewsPageContent from "./NewsPageContent";
import { getNewsIdFromSlugParam, getNewsPath, slugifyNewsTitle } from "@/utils/newsSlug";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function getNewsById(id: number) {
  if (!API_BASE_URL) {
    return null;
  }

  try {
    const baseUrl = API_BASE_URL.replace(/\/$/, "");
    const url = `${baseUrl}/news/${id}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store", // Ensure fresh data for metadata
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Error fetching news for metadata:", error);
    return null;
  }
}

async function getNewsBySlug(slug: string) {
  if (!API_BASE_URL || !slug) {
    return null;
  }

  try {
    const baseUrl = API_BASE_URL.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/news`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const articles = Array.isArray(data?.data) ? data.data : [];
    return (
      articles.find(
        (article: any) => slugifyNewsTitle(article?.title || "") === slug,
      ) || null
    );
  } catch (error) {
    console.error("Error fetching news by slug:", error);
    return null;
  }
}

// Helper function to strip HTML and truncate text for descriptions
function createMetaDescription(text: string, maxLength: number = 160): string {
  // Strip HTML tags if any
  const stripped = text.replace(/<[^>]*>/g, "").trim();
  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength - 3) + "...";
}

// Helper function to extract keywords from content
function extractNewsKeywords(news: any): string[] {
  const keywords: string[] = [];

  // Add title words (important for Google News)
  if (news.title) {
    keywords.push(news.title);
  }

  // Add subtitle
  if (news.subtitle) {
    keywords.push(news.subtitle);
  }

  // Add category
  if (news.category?.name) {
    keywords.push(news.category.name);
  }

  // Add author
  if (news.author) {
    keywords.push(news.author);
  }

  return keywords.filter(Boolean);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: idParam } = await params;

  const resolvedId = getNewsIdFromSlugParam(idParam);
  const news = resolvedId
    ? await getNewsById(resolvedId)
    : await getNewsBySlug(idParam);

  if (news) {
      // Get base URL - use environment variable or default
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "https://thekhmerdailynetwork.com";

      // Ensure image URL is absolute
      let imageUrl = `${baseUrl}/assets/TKDN_Logo/TKDN_Logo_Square.png`; // Default to logo

      if (news.cover) {
        if (
          news.cover.startsWith("http://") ||
          news.cover.startsWith("https://")
        ) {
          imageUrl = news.cover;
        } else if (news.cover.startsWith("/")) {
          imageUrl = `${baseUrl}${news.cover}`;
        } else {
          imageUrl = `${baseUrl}/${news.cover}`;
        }
      }

      // Dynamic SEO - Use the news title for Google to index
      const title = news.title;
      const url = `${baseUrl}${getNewsPath(news)}`;

      // Create optimized description for search engines
      const description = news.subtitle
        ? createMetaDescription(`${news.subtitle}`, 160)
        : createMetaDescription(
            `${news.title} - Read the latest news on The Khmer Daily Network`,
            160,
          );

      // Extract news keywords for Google News
      const newsKeywords = extractNewsKeywords(news);

      // Comprehensive keywords for SEO
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

      // Publication dates - critical for Google News freshness
      const publishedTime = news.date_time_post || news.created_at;
      const modifiedTime =
        news.updated_at || news.date_time_post || news.created_at;

      return {
        // Dynamic title from news article - this is what Google indexes
        title: title,
        description,
        keywords: allKeywords.join(", "),
        authors: [{ name: news.author || "The Khmer Daily Network" }],
        creator: news.author || "The Khmer Daily Network",
        publisher: "The Khmer Daily Network",

        // Robots meta - critical for Google indexing
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

        // Open Graph for social sharing and Google
        openGraph: {
          type: "article",
          title: title,
          description: description,
          url,
          siteName: "The Khmer Daily Network",
          locale: "km_KH", // Khmer locale for better regional targeting
          alternateLocale: ["en_US"],
          images: [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: title,
              type: "image/jpeg",
            },
          ],
          publishedTime: publishedTime,
          modifiedTime: modifiedTime,
          authors: [news.author || "The Khmer Daily Network"],
          ...(news.category && {
            section: news.category.name,
            tags: [news.category.name, ...newsKeywords],
          }),
        },

        // Twitter Card for social sharing
        twitter: {
          card: "summary_large_image",
          title: title,
          description: description,
          images: [imageUrl],
          site: "@TheKhmerDaily",
          creator: "@TheKhmerDaily",
        },

        // Canonical URL - prevents duplicate content
        alternates: {
          canonical: url,
          languages: {
            km: url,
            en: url,
          },
        },

        // Additional metadata for Google News and Search
        other: {
          // Google News specific meta tags
          news_keywords: newsKeywords.slice(0, 10).join(", "), // Google News keywords (max 10)
          "original-source": url,
          "syndication-source": url,

          // Article metadata
          "article:published_time": publishedTime,
          "article:modified_time": modifiedTime,
          "article:author": news.author || "The Khmer Daily Network",
          "article:publisher": "https://www.facebook.com/TheKhmerDailyNetwork", // Your Facebook page

          // Category/Section
          ...(news.category && {
            "article:section": news.category.name,
            "article:tag": news.category.name,
          }),

          // Content freshness signals
          date: publishedTime,
          "last-modified": modifiedTime,

          // Google specific
          "google-site-verification":
            process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
        },
      };
  }

  // Default metadata for category/list pages
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://thekhmerdailynetwork.com";

  // Handle special routes
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

  // Pre-fetch news data by numeric ID (legacy) or slug.
  let initialNewsData = null;
  const resolvedId = getNewsIdFromSlugParam(idParam);
  try {
    const news = resolvedId
      ? await getNewsById(resolvedId)
      : await getNewsBySlug(idParam);
    if (news) {
      initialNewsData = news;
    }
  } catch (error) {
    // If fetch fails, let client-side handle it
    console.error("Error pre-fetching news:", error);
  }

  return <NewsPageContent key={idParam} initialNewsData={initialNewsData} />;
}
