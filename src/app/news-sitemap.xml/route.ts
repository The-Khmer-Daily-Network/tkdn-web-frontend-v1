import { NextResponse } from "next/server";
import { getNewsPath } from "@/utils/newsSlug";

/**
 * Google News Sitemap
 * This sitemap is optimized for Google News and Google Search indexing.
 *
 * - Includes ALL articles (up to 1000)
 * - Google News will automatically prioritize articles from the last 48 hours
 * - Sorted by date (newest first)
 *
 * Documentation: https://support.google.com/news/publisher-center/answer/9607025
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://thekhmerdailynetwork.com";

interface NewsArticle {
  id: number;
  title: string;
  subtitle: string | null;
  author: string;
  date_time_post: string;
  created_at: string;
  updated_at: string;
  category: {
    id: number;
    name: string;
  } | null;
  cover: string | null;
  middle_video_url: string | null;
  content_blocks: Array<{
    subtitle: string | null;
    paragraph: string;
  }>;
}

async function getRecentNews(): Promise<NewsArticle[]> {
  // Use environment variable or fallback to hardcoded URL
  const apiUrl = API_BASE_URL || "https://api.thekhmerdailynetwork.com/api";

  try {
    const baseUrl = apiUrl.replace(/\/$/, "");
    const url = `${baseUrl}/news`;

    console.log("[news-sitemap] Fetching from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    console.log("[news-sitemap] Response status:", response.status);

    if (!response.ok) {
      console.error(
        "[news-sitemap] Response not OK:",
        response.status,
        response.statusText,
      );
      return [];
    }

    const data = await response.json();
    console.log(
      "[news-sitemap] Data success:",
      data.success,
      "Articles count:",
      data.data?.length || 0,
    );

    if (!data.success) {
      console.error("[news-sitemap] API returned success: false");
      return [];
    }

    // Sort all articles by date (newest first)
    const sortedNews = data.data.sort((a: NewsArticle, b: NewsArticle) => {
      const dateA = new Date(a.date_time_post || a.created_at).getTime();
      const dateB = new Date(b.date_time_post || b.created_at).getTime();
      return dateB - dateA; // Newest first
    });

    // Include ALL articles (Google will prioritize recent ones automatically)
    // Limit to 1000 articles (Google sitemap limit)
    console.log("[news-sitemap] Returning", sortedNews.length, "articles");
    return sortedNews.slice(0, 1000);
  } catch (error) {
    console.error("[news-sitemap] Error fetching news:", error);
    return [];
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString();
}

// Extract keywords from news article (max 10 for Google News)
function extractKeywords(article: NewsArticle): string {
  const keywords: string[] = [];

  // Add category name
  if (article.category?.name) {
    keywords.push(article.category.name);
  }

  // Extract key phrases from title (first 5 significant words)
  if (article.title) {
    const titleWords = article.title
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .slice(0, 5);
    keywords.push(...titleWords);
  }

  // Return max 10 keywords, deduplicated
  const uniqueKeywords = [...new Set(keywords)].slice(0, 10);
  return uniqueKeywords.join(", ");
}

export async function GET() {
  const baseUrl = SITE_URL;

  console.log("[news-sitemap] Starting sitemap generation");
  console.log("[news-sitemap] SITE_URL:", SITE_URL);
  console.log("[news-sitemap] API_BASE_URL:", API_BASE_URL);

  const recentNews = await getRecentNews();

  console.log("[news-sitemap] Got", recentNews.length, "articles for sitemap");

  // Generate Google News Sitemap XML
  // Reference: https://support.google.com/news/publisher-center/answer/9607025
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml +=
    '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n';
  xml +=
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  for (const article of recentNews) {
    const articleUrl = `${baseUrl}${getNewsPath(article)}`;
    const publicationDate = article.date_time_post || article.created_at;
    const keywords = extractKeywords(article);

    xml += "  <url>\n";
    xml += `    <loc>${escapeXml(articleUrl)}</loc>\n`;

    // Google News specific tags
    xml += "    <news:news>\n";
    xml += "      <news:publication>\n";
    xml += "        <news:name>The Khmer Daily Network</news:name>\n";
    xml += "        <news:language>km</news:language>\n"; // Khmer language code
    xml += "      </news:publication>\n";
    xml += `      <news:publication_date>${formatDate(publicationDate)}</news:publication_date>\n`;
    xml += `      <news:title>${escapeXml(article.title)}</news:title>\n`;

    // Optional: Add keywords (max 10)
    if (keywords) {
      xml += `      <news:keywords>${escapeXml(keywords)}</news:keywords>\n`;
    }

    xml += "    </news:news>\n";

    // Add image if available (helps with Google Discover and News)
    if (article.cover) {
      const imageUrl = article.cover.startsWith("http")
        ? article.cover
        : `${baseUrl}${article.cover.startsWith("/") ? "" : "/"}${article.cover}`;

      xml += "    <image:image>\n";
      xml += `      <image:loc>${escapeXml(imageUrl)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(article.title)}</image:title>\n`;
      if (article.subtitle) {
        xml += `      <image:caption>${escapeXml(article.subtitle)}</image:caption>\n`;
      }
      xml += "    </image:image>\n";
    }

    xml += "  </url>\n";
  }

  xml += "</urlset>";

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=900", // 15 minutes cache for fresh news
      "X-Content-Type-Options": "nosniff",
    },
  });
}
