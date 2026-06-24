import { NextResponse } from "next/server";
import { SITE_URL } from "@/config/site";
import { categoryNameToSlug } from "@/utils/slug";
import { getNewsPath } from "@/utils/newsSlug";

/**
 * Main Sitemap with Image Extensions
 *
 * This sitemap includes:
 * 1. All static pages (home, about-us, video, etc.)
 * 2. All news articles with their cover images
 * 3. All category pages
 *
 * For Google News specific sitemap, see /news-sitemap.xml
 */

export const revalidate = 3600;
export const runtime = "nodejs";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface NewsArticle {
  id: number;
  title: string;
  subtitle: string | null;
  cover: string | null;
  updated_at: string;
  created_at: string;
  date_time_post: string;
}

interface SitemapCategory {
  id: number;
  name: string;
  subcategories?: SitemapCategory[];
}

async function getAllNews(): Promise<NewsArticle[]> {
  try {
    const apiUrl = API_BASE_URL || "https://api.thekhmerdailynetwork.com/api";
    const baseUrl = apiUrl.replace(/\/$/, "");
    const url = `${baseUrl}/news`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error("Error fetching news for sitemap:", error);
    return [];
  }
}

async function getCategories(): Promise<SitemapCategory[]> {
  try {
    const apiUrl = API_BASE_URL || "https://api.thekhmerdailynetwork.com/api";
    const baseUrl = apiUrl.replace(/\/$/, "");
    const url = `${baseUrl}/categories`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.categories || []) as SitemapCategory[];
  } catch (error) {
    console.error("Error fetching categories for sitemap:", error);
    return [];
  }
}

function formatDate(date: Date): string {
  return date.toISOString();
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Helper to get absolute image URL
function getAbsoluteImageUrl(
  baseUrl: string,
  imageUrl: string | null,
): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

export async function GET() {
  const baseUrl = SITE_URL;

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFreq: "daily",
      priority: "1.0",
    },
    {
      url: `${baseUrl}/home`,
      lastModified: new Date(),
      changeFreq: "daily",
      priority: "1.0",
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFreq: "monthly",
      priority: "0.8",
    },
    {
      url: `${baseUrl}/video`,
      lastModified: new Date(),
      changeFreq: "daily",
      priority: "0.9",
    },
    {
      url: `${baseUrl}/latest`,
      lastModified: new Date(),
      changeFreq: "hourly",
      priority: "0.95",
    },
  ];

  // Fetch all news articles
  const allNews = await getAllNews();

  // Fetch categories
  const categories = await getCategories();
  const categoryPages: Array<{
    url: string;
    lastModified: Date;
    changeFreq: string;
    priority: string;
  }> = [];

  // Add main categories
  categories.forEach((category: SitemapCategory) => {
    const slug = categoryNameToSlug(category.name);
    categoryPages.push({
      url: `${baseUrl}/${slug}`,
      lastModified: new Date(),
      changeFreq: "daily",
      priority: "0.7",
    });

    // Add subcategories
    if (category.subcategories && category.subcategories.length > 0) {
      category.subcategories.forEach((subcategory: SitemapCategory) => {
        const subSlug = categoryNameToSlug(subcategory.name);
        categoryPages.push({
          url: `${baseUrl}/${subSlug}`,
          lastModified: new Date(),
          changeFreq: "daily",
          priority: "0.6",
        });
      });
    }
  });

  // Generate XML with image extensions for better SEO
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml +=
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  // Add static pages
  for (const page of staticPages) {
    xml += "  <url>\n";
    xml += `    <loc>${escapeXml(page.url)}</loc>\n`;
    xml += `    <lastmod>${formatDate(page.lastModified)}</lastmod>\n`;
    xml += `    <changefreq>${page.changeFreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += "  </url>\n";
  }

  // Add news articles with images
  for (const article of allNews) {
    const articleUrl = `${baseUrl}${getNewsPath(article)}`;
    const lastModified = new Date(
      article.updated_at || article.date_time_post || article.created_at,
    );
    const imageUrl = getAbsoluteImageUrl(baseUrl, article.cover);

    xml += "  <url>\n";
    xml += `    <loc>${escapeXml(articleUrl)}</loc>\n`;
    xml += `    <lastmod>${formatDate(lastModified)}</lastmod>\n`;
    xml += "    <changefreq>weekly</changefreq>\n";
    xml += "    <priority>0.8</priority>\n";

    // Add image for Google Image Search indexing
    if (imageUrl) {
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

  // Add category pages
  for (const page of categoryPages) {
    xml += "  <url>\n";
    xml += `    <loc>${escapeXml(page.url)}</loc>\n`;
    xml += `    <lastmod>${formatDate(page.lastModified)}</lastmod>\n`;
    xml += `    <changefreq>${page.changeFreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += "  </url>\n";
  }

  xml += "</urlset>";

  // Return pure XML with proper headers
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    },
  });
}
