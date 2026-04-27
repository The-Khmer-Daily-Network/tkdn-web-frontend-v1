"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getNews, getNewsById } from "@/services/news";
import { getCategories } from "@/services/category";
import { categoryNameToSlug } from "@/utils/slug";
import type { News } from "@/types/news";
import type { Category } from "@/types/category";
import { Play } from "lucide-react";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import BannerSponsor from "@/features/sponsor/bannerSponsor";

interface NewsPageContentProps {
  initialNewsData?: News | null;
}

const ALLOWED_RICH_TEXT_TAGS = new Set([
  "b",
  "strong",
  "i",
  "em",
  "u",
  "a",
  "h1",
  "h2",
  "blockquote",
  "br",
  "img",
]);

const isSafeHref = (href: string) => {
  const normalizedHref = href.trim().toLowerCase();
  return (
    normalizedHref.startsWith("http://") ||
    normalizedHref.startsWith("https://") ||
    normalizedHref.startsWith("mailto:") ||
    normalizedHref.startsWith("tel:") ||
    normalizedHref.startsWith("/")
  );
};

const isSafeImageSrc = (src: string) => {
  const normalizedSrc = src.trim().toLowerCase();
  return (
    normalizedSrc.startsWith("http://") ||
    normalizedSrc.startsWith("https://") ||
    normalizedSrc.startsWith("/")
  );
};

const getImageCaptionFallback = (src: string) => {
  if (!src) return "";
  try {
    const cleanPath = src.split("?")[0].split("#")[0];
    const segment = cleanPath.split("/").filter(Boolean).pop() || "";
    const decoded = decodeURIComponent(segment);
    const withoutExt = decoded.replace(/\.[a-zA-Z0-9]+$/, "");
    return withoutExt.replace(/[-_]+/g, " ").trim();
  } catch {
    return "";
  }
};

const getCaptionText = (preferred?: string | null, src?: string | null) => {
  const explicit = (preferred || "").trim();
  if (explicit) return explicit;
  return getImageCaptionFallback((src || "").trim());
};

const hydrateInlineImageNames = (html: string, imageNameByUrl: Map<string, string>) => {
  if (!html?.trim()) return html;
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return html;

  const images = Array.from(root.querySelectorAll("img"));
  for (const image of images) {
    const src = (image.getAttribute("src") || "").trim();
    if (!src) continue;
    const mappedName = imageNameByUrl.get(src);
    if (!mappedName) continue;
    const alt = (image.getAttribute("alt") || "").trim().toLowerCase();
    if (!alt || alt === "inline image" || alt === "article image") {
      image.setAttribute("alt", mappedName);
    }
    image.setAttribute("title", mappedName);
  }

  return root.innerHTML;
};

const sanitizeRichText = (html: string): string => {
  if (!html?.trim()) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    // Server render fallback: avoid runtime crash; client pass will sanitize.
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return "";

  const walk = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as HTMLElement;
    const tagName = element.tagName.toLowerCase();

    if (!ALLOWED_RICH_TEXT_TAGS.has(tagName)) {
      const parent = element.parentNode;
      if (!parent) return;
      const unwrappedChildren = [...element.childNodes];
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
      // Continue sanitizing children after unwrapping unsupported wrappers
      // (e.g. <div><img/></div>) so image caption logic still runs.
      for (const child of unwrappedChildren) {
        walk(child);
      }
      return;
    }

    const attributes = [...element.attributes];
    for (const attr of attributes) {
      const attrName = attr.name.toLowerCase();

      if (tagName === "a") {
        if (attrName !== "href" && attrName !== "target" && attrName !== "rel") {
          element.removeAttribute(attr.name);
        }
        continue;
      }

      if (tagName === "img") {
        if (attrName !== "src" && attrName !== "alt" && attrName !== "title") {
          element.removeAttribute(attr.name);
        }
        continue;
      }

      element.removeAttribute(attr.name);
    }

    if (tagName === "a") {
      const href = element.getAttribute("href") || "";
      if (!isSafeHref(href)) {
        element.removeAttribute("href");
      }
      element.setAttribute("rel", "noopener noreferrer");
      element.setAttribute("target", "_blank");
    }

    if (tagName === "img") {
      const src = element.getAttribute("src") || "";
      if (!isSafeImageSrc(src)) {
        element.remove();
        return;
      }
      element.setAttribute("loading", "lazy");
      if (!element.getAttribute("alt")) {
        element.setAttribute("alt", "Article image");
      }
      const captionText = (
        element.getAttribute("title") ||
        element.getAttribute("alt") ||
        getImageCaptionFallback(src)
      ).trim();
      if (
        captionText &&
        captionText.toLowerCase() !== "inline image" &&
        captionText.toLowerCase() !== "article image"
      ) {
        const nextSibling = element.nextElementSibling;
        const hasCaptionAlready =
          !!nextSibling &&
          nextSibling.tagName.toLowerCase() === "i" &&
          (nextSibling.getAttribute("data-img-caption") || "") === "true";
        if (!hasCaptionAlready) {
          const captionNode = doc.createElement("i");
          captionNode.setAttribute("data-img-caption", "true");
          captionNode.textContent = captionText;
          element.insertAdjacentElement("afterend", captionNode);
        }
      }
    }

    if (tagName === "blockquote") {
      const quoteText = (element.textContent || "").replace(/\u00A0/g, "").trim();
      const hasImage = element.querySelector("img") !== null;
      if (!quoteText && !hasImage) {
        element.remove();
        return;
      }
    }

    const children = [...element.childNodes];
    for (const child of children) {
      walk(child);
    }
  };

  const children = [...root.childNodes];
  for (const child of children) {
    walk(child);
  }

  return root.innerHTML;
};

export default function NewsPageContent({
  initialNewsData = null,
}: NewsPageContentProps = {}) {
  const params = useParams();
  const idParam = params?.id as string;
  const [news, setNews] = useState<News[]>([]);
  const [singleNews, setSingleNews] = useState<News | null>(initialNewsData);
  const [category, setCategory] = useState<Category | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [isNewsDetail, setIsNewsDetail] = useState(!!initialNewsData);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [loading, setLoading] = useState(!initialNewsData);
  const [error, setError] = useState<string | null>(null);

  // Ref to track if fetch has been called to prevent duplicate calls in React Strict Mode
  const hasFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    // If we already have initial news data, skip fetching
    if (initialNewsData) {
      return;
    }

    // Prevent duplicate calls in React Strict Mode (development)
    if (idParam && hasFetchedRef.current !== idParam) {
      hasFetchedRef.current = idParam;
      fetchCategoryData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      const idParamLower = idParam.toLowerCase().trim();

      // Check if it's the "latest" route (not a category)
      if (idParamLower === "latest") {
        // Fetch all latest news sorted by date
        await fetchLatestNews();
        return;
      }

      // Check if it's the "video" route (not a category)
      if (idParamLower === "video") {
        // Fetch all news with video URL
        await fetchVideoNews();
        return;
      }

      // Try to parse as number first (for /news/123 routes)
      const numericId = parseInt(idParam, 10);
      if (!isNaN(numericId)) {
        // If we have initial news data, use it instead of fetching
        if (initialNewsData && initialNewsData.id === numericId) {
          setSingleNews(initialNewsData);
          setIsNewsDetail(true);
          setCategory(null);
          setNews([]);
          setLoading(false);
          return;
        }

        // First, try to fetch as news ID
        try {
          const newsResponse = await getNewsById(numericId);
          if (newsResponse.success && newsResponse.data) {
            // It's a news ID - display news detail
            setSingleNews(newsResponse.data);
            setIsNewsDetail(true);
            setCategory(null);
            setNews([]);
            setLoading(false);
            return;
          }
        } catch (err) {
          // Not a news ID, continue to check categories
          console.log("Not a news ID, checking categories...");
        }
      }

      const response = await getCategories();
      let foundCategory: Category | null = null;
      let foundCategoryId: number | null = null;

      if (!isNaN(numericId)) {
        // It's a numeric ID - check categories
        const found = response.categories.find((cat) => cat.id === numericId);
        if (found) {
          // Found main category
          foundCategory = found;
          foundCategoryId = found.id;
        } else {
          // Check subcategories
          for (const cat of response.categories) {
            const subcategory = cat.subcategories.find(
              (sub) => sub.id === numericId,
            );
            if (subcategory) {
              // Found subcategory
              foundCategory = {
                id: subcategory.id,
                name: subcategory.name,
                parent_id: subcategory.parent_id,
                subcategories: [], // Empty array indicates it's a subcategory
              };
              foundCategoryId = subcategory.id;
              break;
            }
          }
        }
      } else {
        // It's a slug (like "national"), find by name
        const slugLower = idParamLower;

        // Search through main categories first
        for (const cat of response.categories) {
          const catSlug = categoryNameToSlug(cat.name).toLowerCase();
          const catNameLower = cat.name.toLowerCase().trim();

          if (catSlug === slugLower || catNameLower === slugLower) {
            // Found main category - backend will include main + all subcategories
            foundCategory = cat;
            foundCategoryId = cat.id;
            break;
          }

          // Check subcategories
          for (const subcat of cat.subcategories) {
            const subcatSlug = categoryNameToSlug(subcat.name).toLowerCase();
            const subcatNameLower = subcat.name.toLowerCase().trim();

            if (subcatSlug === slugLower || subcatNameLower === slugLower) {
              // Found subcategory - backend will show only this subcategory
              foundCategory = {
                id: subcat.id,
                name: subcat.name,
                parent_id: subcat.parent_id,
                subcategories: [], // Empty array indicates it's a subcategory
              };
              foundCategoryId = subcat.id;
              break;
            }
          }
          if (foundCategory) break;
        }
      }

      if (foundCategory && foundCategoryId) {
        setCategory(foundCategory);
        setCategoryId(foundCategoryId);
        // Fetch news with the category ID
        // Backend will automatically:
        // - For main categories: include main + all subcategories
        // - For subcategories: include only that subcategory
        await fetchNews(foundCategoryId, foundCategory);
      } else {
        setError("Category not found");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching category:", err);
      setError("Failed to load category");
      setLoading(false);
    }
  };

  const fetchLatestNews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all news without category filter
      const response = await getNews();

      // Sort by date_time_post (newest first)
      const sortedNews = response.data.sort((a, b) => {
        const dateA = new Date(a.date_time_post).getTime();
        const dateB = new Date(b.date_time_post).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      setNews(sortedNews);
      setCategory(null); // No category for "latest"
    } catch (err) {
      console.error("Error fetching latest news:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch latest news",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoNews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all news without category filter
      const response = await getNews();

      // Filter news with video URL (middle_video_url) not null
      const videosWithUrl = response.data.filter(
        (article) =>
          article.middle_video_url !== null &&
          article.middle_video_url !== undefined,
      );

      // Sort by date_time_post (newest first)
      const sortedNews = videosWithUrl.sort((a, b) => {
        const dateA = new Date(a.date_time_post).getTime();
        const dateB = new Date(b.date_time_post).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      setNews(sortedNews);
      setCategory(null); // No category for "video"
    } catch (err) {
      console.error("Error fetching video news:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch video news",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchNews = async (
    targetCategoryId: number,
    targetCategory: Category,
  ) => {
    if (!targetCategoryId || !targetCategory) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all news first (or use backend filtering if it works)
      const response = await getNews(targetCategoryId);

      // Determine allowed category IDs for filtering
      let allowedCategoryIds: number[] = [];

      // Check if it's a main category (has subcategories)
      const isMainCategory =
        targetCategory.parent_id === null &&
        targetCategory.subcategories &&
        targetCategory.subcategories.length > 0;

      if (isMainCategory) {
        // Main category: Include main category ID + all subcategory IDs
        const subcategoryIds = targetCategory.subcategories.map(
          (sub) => sub.id,
        );
        allowedCategoryIds = [targetCategory.id, ...subcategoryIds];
      } else {
        // Subcategory or main category without subcategories: Only the exact category ID
        allowedCategoryIds = [targetCategoryId];
      }

      // Filter articles to only show those matching the allowed category IDs
      // Articles with video URLs are included if they match the category (no special filtering)
      const filteredNews = response.data.filter((article) => {
        // Exclude articles without category
        if (!article.category || !article.category.id) {
          return false;
        }

        // Check if article's category ID is in the allowed list
        // This includes both video and non-video articles
        return allowedCategoryIds.includes(article.category.id);
      });

      // Sort by date_time_post (newest first)
      const sortedNews = filteredNews.sort((a, b) => {
        const dateA = new Date(a.date_time_post).getTime();
        const dateB = new Date(b.date_time_post).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      setNews(sortedNews);
    } catch (err) {
      console.error("Error fetching news:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch news");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${day} ${month} ${year} ${displayHour}:${displayMinutes}${period}`;
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${day} ${month} ${year} ${displayHour}:${displayMinutes} ${period}`;
  };

  // Calculate relative time (e.g., "1 minute ago", "3 days ago")
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
  };

  // Convert YouTube URL to embed format
  const convertToYouTubeEmbed = (url: string | null): string | null => {
    if (!url) return null;

    try {
      let videoId: string | null = null;

      // Handle youtu.be format
      const youtuBeMatch = url.match(/(?:youtu\.be\/)([^&\n?#]+)/);
      if (youtuBeMatch) {
        videoId = youtuBeMatch[1].split("&")[0].split("?")[0].trim();
      }

      // Handle youtube.com/watch?v= format
      const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([^&\n?#]+)/);
      if (watchMatch) {
        videoId = watchMatch[1].split("&")[0].split("?")[0].trim();
      }

      // Handle youtube.com/embed/ format (already embed)
      const embedMatch = url.match(/(?:youtube\.com\/embed\/)([^&\n?#]+)/);
      if (embedMatch) {
        return url;
      }

      // Handle youtube.com/shorts/ format
      const shortsMatch = url.match(/(?:youtube\.com\/shorts\/)([^&\n?#]+)/);
      if (shortsMatch) {
        videoId = shortsMatch[1].split("&")[0].split("?")[0].trim();
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      return url;
    } catch (error) {
      console.error("Error converting YouTube URL:", error);
      return url;
    }
  };

  // Get YouTube thumbnail URL from video ID
  const getYouTubeThumbnail = (url: string | null): string | null => {
    if (!url) return null;

    let videoId: string | null = null;

    const youtuBeMatch = url.match(/(?:youtu\.be\/)([^&\n?#]+)/);
    if (youtuBeMatch) {
      videoId = youtuBeMatch[1].split("&")[0].split("?")[0].trim();
    }

    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([^&\n?#]+)/);
    if (watchMatch) {
      videoId = watchMatch[1].split("&")[0].split("?")[0].trim();
    }

    const embedMatch = url.match(/(?:youtube\.com\/embed\/)([^&\n?#]+)/);
    if (embedMatch) {
      videoId = embedMatch[1].split("&")[0].split("?")[0].trim();
    }

    const shortsMatch = url.match(/(?:youtube\.com\/shorts\/)([^&\n?#]+)/);
    if (shortsMatch) {
      videoId = shortsMatch[1].split("&")[0].split("?")[0].trim();
    }

    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }

    return null;
  };

  // Check if URL is a YouTube URL
  const isYouTubeUrl = (url: string | null): boolean => {
    if (!url) return false;
    return /youtube\.com|youtu\.be/.test(url);
  };

  // Get video thumbnail (YouTube or direct video)
  const getVideoThumbnail = (url: string | null): string | null => {
    if (!url) return null;

    if (isYouTubeUrl(url)) {
      return getYouTubeThumbnail(url);
    }

    // For direct video URLs, return null (we'll use video poster or default)
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading news...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  // Generate SEO metadata based on page content
  const getSEOMetadata = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const currentUrl = `${baseUrl}/news/${idParam}`;

    if (isNewsDetail && singleNews) {
      return {
        title: singleNews.title, // Use clean title for better search matching
        description: singleNews.subtitle
          ? `${singleNews.subtitle} - The Khmer Daily Network`
          : `${singleNews.title} - Read the full article on The Khmer Daily Network`,
        subtitle:
          singleNews.subtitle || `Read the full article: ${singleNews.title}`,
        keywords: [
          singleNews.title,
          singleNews.subtitle,
          singleNews.category?.name || "",
          // Brand variations
          "The Khmer Daily Network",
          "The Khmer",
          "Khmer Daily",
          "TKDN",
          "TKDN news",
          // News keywords
          "news",
          "articles",
          "Cambodia news",
          "Khmer news",
          "latest news",
          "breaking news",
        ]
          .filter(Boolean)
          .join(", "),
        url: currentUrl,
        image: singleNews.cover || undefined,
        type: "article",
        datePublished: singleNews.date_time_post || singleNews.created_at,
        dateModified:
          singleNews.updated_at ||
          singleNews.date_time_post ||
          singleNews.created_at,
        author: singleNews.author,
      };
    } else if (category) {
      return {
        title: `${category.name} - The Khmer Daily Network`,
        description: `Browse ${category.name} news and articles on The Khmer Daily Network. Stay updated with the latest ${category.name.toLowerCase()} stories, breaking news, and in-depth coverage.`,
        subtitle: `Find the latest ${category.name} news, articles, and updates. ${news.length} ${news.length === 1 ? "article" : "articles"} available.`,
        keywords: `${category.name}, news, articles, The Khmer Daily Network, Cambodia, Khmer news`,
        url: currentUrl,
      };
    } else if (idParam?.toLowerCase() === "latest") {
      return {
        title: "Latest News - The Khmer Daily Network",
        description:
          "Stay updated with the latest news and breaking stories from The Khmer Daily Network. Get real-time updates on national, international, and local news.",
        subtitle: `Discover the most recent news articles and stories. ${news.length} ${news.length === 1 ? "article" : "articles"} available.`,
        keywords:
          "latest news, breaking news, current events, The Khmer Daily Network, Cambodia news, Khmer news",
        url: currentUrl,
      };
    } else if (idParam?.toLowerCase() === "video") {
      return {
        title: "News Videos - The Khmer Daily Network",
        description:
          "Watch the latest news videos and video reports from The Khmer Daily Network. Stay informed with video coverage of breaking news and stories.",
        subtitle: `Watch the latest news videos and video reports. ${news.length} ${news.length === 1 ? "video" : "videos"} available.`,
        keywords:
          "news videos, video news, video reports, The Khmer Daily Network, Cambodia videos, Khmer videos",
        url: currentUrl,
      };
    }

    return {
      title: "The Khmer Daily Network",
      description:
        "The Khmer Daily Network - Your trusted source for news, articles, and updates.",
      subtitle: "Stay informed with the latest news and stories.",
      keywords: "news, articles, The Khmer Daily Network, Cambodia, Khmer",
      url: currentUrl,
      type: "website",
    };
  };

  const seoData = getSEOMetadata();

  // If it's a news detail page, show the news detail view
  if (isNewsDetail && singleNews) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const articleUrl = `${baseUrl}/news/${singleNews.id}`;
    const hasInlineContentImages = (singleNews.content_blocks || []).some((block) =>
      /<img[\s>]/i.test(block.paragraph || ""),
    );
    const inlineImageNameByUrl = new Map<string, string>();
    if (singleNews.middle_image_url) {
      const middleName = getCaptionText(
        singleNews.middle_image_name || (singleNews as any).middleImageName,
        singleNews.middle_image_url,
      );
      if (middleName) inlineImageNameByUrl.set(singleNews.middle_image_url, middleName);
    }
    for (const endImage of singleNews.end_images || []) {
      if (!endImage?.url) continue;
      const endName = getCaptionText(
        endImage.name || (endImage as any).title,
        endImage.url,
      );
      if (endName) inlineImageNameByUrl.set(endImage.url, endName);
    }

    // Ensure image URL is absolute
    let imageUrl = `${baseUrl}/assets/TKDN_Logo/TKDN_Logo_Square.png`;
    if (singleNews.cover) {
      if (
        singleNews.cover.startsWith("http://") ||
        singleNews.cover.startsWith("https://")
      ) {
        imageUrl = singleNews.cover;
      } else if (singleNews.cover.startsWith("/")) {
        imageUrl = `${baseUrl}${singleNews.cover}`;
      } else {
        imageUrl = `${baseUrl}/${singleNews.cover}`;
      }
    }

    // Enhanced structured data for Google News and Google Search
    // Following Google's guidelines: https://developers.google.com/search/docs/appearance/structured-data/article
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",

      // Primary identifiers - critical for Google News indexing
      headline: singleNews.title,
      name: singleNews.title,
      description: singleNews.subtitle || singleNews.title,

      // Images - required for Google Discover and News
      image: [
        imageUrl,
        // Additional image formats if available
        {
          "@type": "ImageObject",
          url: imageUrl,
          width: 1200,
          height: 630,
        },
      ],

      // Dates - critical for Google News freshness
      datePublished: singleNews.date_time_post || singleNews.created_at,
      dateModified:
        singleNews.updated_at ||
        singleNews.date_time_post ||
        singleNews.created_at,
      dateCreated: singleNews.created_at,

      // Author information
      author: {
        "@type": "Person",
        name: singleNews.author || "The Khmer Daily Network",
        url: baseUrl,
      },

      // Publisher - required for Google News
      publisher: {
        "@type": "NewsMediaOrganization",
        name: "The Khmer Daily Network",
        "@id": `${baseUrl}/#organization`,
        url: baseUrl,
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/assets/TKDN_Logo/TKDN_Logo_Square.png`,
          width: 512,
          height: 512,
        },
        sameAs: [
          "https://www.facebook.com/TheKhmerDailyNetwork",
          // Add your other social media URLs here
        ],
      },

      // Main entity - important for SEO
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": articleUrl,
        url: articleUrl,
        name: singleNews.title,
      },

      // Direct URL
      url: articleUrl,

      // Language - important for regional targeting
      inLanguage: "km", // Khmer language code

      // Accessibility - indicates free content (improves Google News ranking)
      isAccessibleForFree: true,

      // Article body excerpt for rich snippets
      articleBody:
        singleNews.content_blocks && singleNews.content_blocks.length > 0
          ? singleNews.content_blocks[0].paragraph.substring(0, 500)
          : singleNews.subtitle || singleNews.title,

      // Word count estimation (helps Google understand content depth)
      wordCount: singleNews.content_blocks
        ? singleNews.content_blocks.reduce(
            (acc, block) => acc + block.paragraph.split(/\s+/).length,
            0,
          )
        : 0,

      // Keywords for discoverability
      keywords: [
        singleNews.title,
        singleNews.subtitle,
        singleNews.category?.name,
        "The Khmer Daily Network",
        "TKDN",
        "Cambodia news",
        "Khmer news",
      ]
        .filter(Boolean)
        .join(", "),

      // Category/Section
      ...(singleNews.category && {
        articleSection: singleNews.category.name,
        about: {
          "@type": "Thing",
          name: singleNews.category.name,
        },
      }),

      // Speakable - for Google Assistant and voice search
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", ".article-content p:first-of-type"],
      },

      // Breadcrumb for navigation
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: baseUrl,
          },
          ...(singleNews.category
            ? [
                {
                  "@type": "ListItem",
                  position: 2,
                  name: singleNews.category.name,
                  item: `${baseUrl}/${singleNews.category.name.toLowerCase().replace(/\s+/g, "-")}`,
                },
              ]
            : []),
          {
            "@type": "ListItem",
            position: singleNews.category ? 3 : 2,
            name: singleNews.title,
            item: articleUrl,
          },
        ],
      },

      // Potential action for search features
      potentialAction: {
        "@type": "ReadAction",
        target: articleUrl,
      },
    };

    return (
      <>
        <StructuredData data={structuredData} />
        <SEO
          title={seoData.title}
          description={seoData.description}
          subtitle={seoData.subtitle}
          keywords={seoData.keywords}
          url={seoData.url}
          image={seoData.image}
          type={seoData.type}
          {...(seoData.datePublished && {
            datePublished: seoData.datePublished,
          })}
          {...(seoData.dateModified && { dateModified: seoData.dateModified })}
          {...(seoData.author && { author: seoData.author })}
        />
        <BannerSponsor />
        <div className="w-full max-w-4xl mx-auto space-y-6 mt-6">
          {/* Metadata Header with Red Bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-12 rounded-[10px] bg-[#E34C33]"></div>
            <div className="flex flex-col">
              {singleNews.category && (
                <span
                  className="text-sm font-bold text-[#1D2229] uppercase"
                 
              >
                  {singleNews.category.name}
                </span>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">
                  {formatDateShort(singleNews.date_time_post)}
                </span>
                <span className="text-xs text-gray-500">
                  • {getRelativeTime(singleNews.date_time_post)}
                </span>
                {singleNews.author && (
                  <span className="text-sm text-gray-600">
                    • {singleNews.author}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Main Title – Inter Khmer Looped Black from public/Khmer */}
          <h1
            className="text-xl md:text-2xl lg:text-3xl font-black text-[#1D2229] leading-snug"
            
        >
            {singleNews.title}
          </h1>

          {/* Subtitle */}
          {singleNews.subtitle && (
            <p
              className="text-xl text-gray-700 mt-4"
             
          >
              {singleNews.subtitle}
            </p>
          )}

          {/* {singleNews.author && (
            <p className="text-sm text-gray-600 mt-2">
              By {singleNews.author}
            </p>
          )} */}

          {/* Cover Image */}
          {singleNews.cover && (
            <div className="w-full mt-6">
              <img
                src={singleNews.cover}
                alt={singleNews.title}
                className="h-auto w-full object-cover rounded-lg aspect-[100/53]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              {/* Cover Image Caption – AKbalthom (article/image font) */}
              {getCaptionText(
                singleNews.cover_name || (singleNews as any).coverName,
                singleNews.cover,
              ) && (
                <p
                  className="text-sm text-gray-600 mt-2 italic"
                 
              >
                  {getCaptionText(
                    singleNews.cover_name || (singleNews as any).coverName,
                    singleNews.cover,
                  )}
                </p>
              )}
            </div>
          )}

          {/* Content Blocks with Middle Media */}
          {singleNews.content_blocks &&
            singleNews.content_blocks.length > 0 && (
              <div className="prose prose-lg max-w-none mt-6 space-y-6">
                {singleNews.content_blocks.map((block, index) => {
                  // Split paragraph by single line breaks (\n) to create separate paragraphs with spacing
                  // This treats each line break as a paragraph break
                  const paragraphs = block.paragraph
                    .split(/\n/)
                    .filter((p) => p.trim());

                  return (
                    <div key={index} className="space-y-6">
                      {/* Block Subtitle (if exists) */}
                      {block.subtitle && (
                        <h2
                          className="text-2xl font-bold text-[#1D2229] mt-8 mb-6"
                         
                      >
                          {block.subtitle}
                        </h2>
                      )}

                      {/* Block Paragraphs - Split by line breaks, each creates a new paragraph with spacing */}
                      <div className="space-y-4">
                        {paragraphs.map((paragraph, paraIndex) => (
                          <div
                            key={paraIndex}
                            className="text-[16px] text-gray-800 leading-relaxed [&_a]:text-current [&_a]:underline [&_img]:my-4 [&_img]:!w-full [&_img]:!aspect-[100/53] [&_img]:!h-auto [&_img]:rounded-lg [&_img]:!object-cover [&_img+_i]:-mt-1 [&_img+_i]:mb-3 [&_img+_i]:block [&_img+_i]:text-sm [&_img+_i]:italic [&_img+_i]:text-gray-600 [&_b]:font-bold [&_strong]:font-bold [&_h2]:my-2 [&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:leading-snug [&_h2_b]:font-bold [&_h2_strong]:font-bold [&_blockquote]:relative [&_blockquote]:my-2 [&_blockquote]:py-1 [&_blockquote]:pl-8 [&_blockquote]:pr-2 [&_blockquote]:text-[20px] [&_blockquote]:font-bold [&_blockquote]:italic [&_blockquote]:text-current [&_blockquote]:before:absolute [&_blockquote]:before:left-1 [&_blockquote]:before:top-[14px] [&_blockquote]:before:font-serif [&_blockquote]:before:font-bold [&_blockquote]:before:not-italic [&_blockquote]:before:text-[45px] [&_blockquote]:before:leading-none [&_blockquote]:before:text-current [&_blockquote]:before:content-['“'] [&_blockquote]:after:relative [&_blockquote]:after:top-[14px] [&_blockquote]:after:ml-1 [&_blockquote]:after:font-serif [&_blockquote]:after:font-bold [&_blockquote]:after:not-italic [&_blockquote]:after:text-[45px] [&_blockquote]:after:leading-none [&_blockquote]:after:text-current [&_blockquote]:after:content-['”']"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeRichText(
                                hydrateInlineImageNames(
                                  paragraph.trim(),
                                  inlineImageNameByUrl,
                                ),
                              ),
                            }}
                          />
                        ))}
                      </div>

                      {/* Insert Middle Media after first paragraph */}
                      {index === 0 && (
                        <>
                          {/* Middle Video */}
                          {singleNews.middle_video_url &&
                            (() => {
                              const videoUrl = singleNews.middle_video_url;
                              const isYouTube = isYouTubeUrl(videoUrl);
                              const embedUrl = isYouTube
                                ? convertToYouTubeEmbed(videoUrl)
                                : null;
                              const thumbnailUrl = getVideoThumbnail(videoUrl);

                              return (
                                <div className="w-full my-8">
                                  {isVideoPlaying && !isYouTube ? (
                                    /* Video Player - Show when clicked (only for direct videos) */
                                    <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden">
                                      {/* Direct Video from Storage - Use HTML5 video element */}
                                      <video
                                        src={videoUrl}
                                        controls
                                        autoPlay
                                        className="w-full h-full object-contain"
                                        style={{
                                          position: "absolute",
                                          top: 0,
                                          left: 0,
                                          width: "100%",
                                          height: "100%",
                                        }}
                                        onError={(e) => {
                                          console.error(
                                            "Video failed to load:",
                                            videoUrl,
                                          );
                                          const video =
                                            e.target as HTMLVideoElement;
                                          video.style.display = "none";
                                        }}
                                    >
                                        Your browser does not support the video
                                        tag.
                                      </video>

                                      {/* Close/Back button to return to thumbnail */}
                                      <button
                                        onClick={() => setIsVideoPlaying(false)}
                                        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded hover:bg-opacity-70 transition-all z-30"
                                    >
                                        × Close
                                      </button>
                                    </div>
                                  ) : (
                                    /* Thumbnail with Play Button - Show before click */
                                    <div
                                      onClick={() => {
                                        if (isYouTube) {
                                          // For YouTube videos, open directly in new tab
                                          window.open(
                                            videoUrl,
                                            "_blank",
                                            "noopener,noreferrer",
                                          );
                                        } else {
                                          // For direct videos, play inline
                                          setIsVideoPlaying(true);
                                        }
                                      }}
                                      className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden cursor-pointer group"
                                  >
                                      {/* Thumbnail Image */}
                                      {thumbnailUrl ? (
                                        <img
                                          src={thumbnailUrl}
                                          alt={singleNews.title}
                                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                          style={{ zIndex: 0 }}
                                          onError={(e) => {
                                            const img =
                                              e.target as HTMLImageElement;
                                            const currentSrc = img.src;
                                            if (
                                              currentSrc.includes(
                                                "maxresdefault",
                                              )
                                            ) {
                                              const videoId =
                                                currentSrc.match(
                                                  /vi\/([^\/]+)\//,
                                                )?.[1];
                                              if (videoId) {
                                                img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                              } else {
                                                img.style.display = "none";
                                              }
                                            } else if (
                                              currentSrc.includes("hqdefault")
                                            ) {
                                              img.style.display = "none";
                                            }
                                          }}
                                        />
                                      ) : (
                                        /* For direct video URLs, show default placeholder or use cover image if available */
                                        <>
                                          {singleNews.cover && !isYouTube ? (
                                            <img
                                              src={singleNews.cover}
                                              alt={singleNews.title}
                                              className="absolute inset-0 w-full h-full object-cover"
                                              style={{ zIndex: 0 }}
                                            />
                                          ) : (
                                            <div
                                              className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center"
                                              style={{ zIndex: 0 }}
                                          >
                                              <Play className="w-16 h-16 text-gray-500" />
                                            </div>
                                          )}
                                        </>
                                      )}

                                      {/* Play Button Overlay */}
                                      <div className="absolute inset-0 flex items-center justify-center bg-opacity-30 group-hover:bg-opacity-40 transition-all z-10">
                                        <div className="w-20 h-20 rounded-full bg-[#ffffff]/50 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                          <Play
                                            className="w-10 h-10 text-white ml-1"
                                            fill="currentColor"
                                          />
                                        </div>
                                      </div>

                                      {/* Hover text */}
                                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <span className="text-white font-medium text-sm bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                                          {isYouTube
                                            ? "Click to watch on YouTube"
                                            : "Click to play video"}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Video Caption */}
                                  {singleNews.middle_video_name && (
                                    <p className="text-sm text-gray-600 mt-2 italic">
                                      {singleNews.middle_video_name}
                                    </p>
                                  )}
                                </div>
                              );
                            })()}

                          {/* Middle Image (if no video) */}
                          {!hasInlineContentImages &&
                            !singleNews.middle_video_url &&
                            singleNews.middle_image_url && (
                              <div className="w-full my-8">
                                <img
                                  src={singleNews.middle_image_url}
                                  alt={
                                    singleNews.middle_image_name ||
                                    singleNews.title
                                  }
                                  className="h-auto w-full object-cover rounded-lg aspect-[100/53]"
                                  onError={(e) => {
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                  }}
                                />
                                {/* Image Caption */}
                                {getCaptionText(
                                  singleNews.middle_image_name ||
                                    (singleNews as any).middleImageName,
                                  singleNews.middle_image_url,
                                ) && (
                                  <p className="text-sm text-gray-600 mt-2 italic">
                                    {getCaptionText(
                                      singleNews.middle_image_name ||
                                        (singleNews as any).middleImageName,
                                      singleNews.middle_image_url,
                                    )}
                                  </p>
                                )}
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          {/* End Images */}
          {!hasInlineContentImages &&
            singleNews.end_images &&
            singleNews.end_images.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {singleNews.end_images.map((endImage, index) => (
                <div key={index} className="w-full">
                  <img
                    src={endImage.url}
                    alt={endImage.name || `End image ${index + 1}`}
                    className="h-auto w-full object-cover rounded-lg aspect-[100/63.8]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  {/* End Image Caption */}
                  {getCaptionText(
                    endImage.name || (endImage as any).title,
                    endImage.url,
                  ) && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      {getCaptionText(
                        endImage.name || (endImage as any).title,
                        endImage.url,
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={seoData.title}
        description={seoData.description}
        subtitle={seoData.subtitle}
        keywords={seoData.keywords}
        url={seoData.url}
        image={news.length > 0 && news[0].cover ? news[0].cover : undefined}
      />
      <div className="w-full space-y-6">
        {/* Category Header, Latest Header, or Video Header */}
        {category ? (
          <div className="border-b border-gray-200 pb-4">
            <h1
              className="text-2xl font-bold text-[#1D2229]"
             
          >
              {category.name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {news.length} {news.length === 1 ? "article" : "articles"} found
            </p>
          </div>
        ) : idParam?.toLowerCase() === "latest" ? (
          <div className="border-b border-gray-200 pb-4">
            <h1 className="text-2xl font-bold text-[#1D2229]">Latest News</h1>
            <p className="text-sm text-gray-600 mt-1">
              {news.length} {news.length === 1 ? "article" : "articles"} found
            </p>
          </div>
        ) : idParam?.toLowerCase() === "video" ? (
          <div className="border-b border-gray-200 pb-4">
            <h1 className="text-2xl font-bold text-[#1D2229]">News Video</h1>
            <p className="text-sm text-gray-600 mt-1">
              {news.length} {news.length === 1 ? "video" : "videos"} found
            </p>
          </div>
        ) : null}

        {/* News List/Grid */}
        {news.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600">No news available for this category</p>
          </div>
        ) : (
          <>
            {/* Mobile: List View (max-width: 767px) */}
            <div className="space-y-4 md:hidden">
              {news.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.id}`}
                  className="flex flex-row gap-4 cursor-pointer hover:opacity-90 transition-opacity"
              >
                  {/* Article Image */}
                  <div className="relative w-[250px] h-[160px] shrink-0 rounded-lg overflow-hidden bg-gray-200 group">
                    {article.cover && (
                      <img
                        src={article.cover}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    {/* Play Button Overlay for Videos */}
                    {article.middle_video_url && (
                      <div className="absolute inset-0 flex items-center justify-center bg-opacity-30 group-hover:bg-opacity-40 transition-all">
                        <div className="w-16 h-16 rounded-full bg-[#ffffff]/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play
                            className="w-8 h-8 text-[#ffffff] ml-1"
                            fill="currentColor"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Article Info */}
                  <div className="flex-1 flex flex-col justify-center space-y-2">
                    <div className="flex flex-row space-x-5 max-[481px]:flex-col max-[481px]:space-x-0 max-[481px]:space-y-1">
                      {article.category && (
                        <span
                          className="text-xs max-[481px]:text-[10px] font-semibold text-[#1D2229] underline decoration-[#E34C33] decoration-2 underline-offset-5 uppercase"
                         
                      >
                          {article.category.name}
                        </span>
                      )}
                      <p
                        className="text-xs max-[481px]:text-[10px] font-medium"
                        style={{
                          color: "rgba(29, 34, 41, 0.6784)",
                        }}
                    >
                        {formatDate(article.date_time_post)}
                      </p>
                    </div>
                    <h2
                      className="text-lg max-[481px]:text-sm font-semibold text-gray-900 line-clamp-2 leading-tight"
                     
                  >
                      {article.title}
                    </h2>
                    {article.subtitle && (
                      <p
                        className="text-sm max-[481px]:text-xs text-gray-600 line-clamp-2 mt-1"
                       
                    >
                        {article.subtitle}
                      </p>
                    )}
                    {article.content_blocks &&
                      article.content_blocks.length > 0 && (
                        <p
                          className="text-sm max-[481px]:text-xs text-gray-600 line-clamp-2 mt-1"
                         
                      >
                          {article.content_blocks[0].paragraph}
                        </p>
                      )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop: Grid View (min-width: 768px) */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.id}`}
                  className="flex flex-col space-y-3 cursor-pointer hover:opacity-90 transition-opacity"
              >
                  {/* Article Image */}
                  {article.cover && (
                    <div className="relative w-full h-[200px] rounded-xl overflow-hidden bg-gray-200 group">
                      <img
                        src={article.cover}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      {/* Play Button Overlay for Videos */}
                      {article.middle_video_url && (
                        <div className="absolute inset-0 flex items-center justify-center bg-opacity-30 group-hover:bg-opacity-40 transition-all">
                          <div className="w-16 h-16 rounded-full bg-[#ffffff]/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play
                              className="w-8 h-8 text-[#ffffff] ml-1"
                              fill="currentColor"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Article Info */}
                  <div className="flex flex-col space-y-2">
                    {article.category && (
                      <span
                        className="text-xs max-[481px]:text-[10px] font-semibold text-[#1D2229] underline decoration-[#E34C33] decoration-2 underline-offset-5 uppercase"
                       
                    >
                        {article.category.name}
                      </span>
                    )}
                    <p className="text-xs text-[#1D2229] font-medium">
                      {formatDate(article.date_time_post)}
                    </p>
                    <h2
                      className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight"
                     
                  >
                      {article.title}
                    </h2>
                    {article.subtitle && (
                      <p
                        className="text-sm text-gray-600 line-clamp-2"
                       
                    >
                        {article.subtitle}
                      </p>
                    )}
                    {article.content_blocks &&
                      article.content_blocks.length > 0 && (
                        <p
                          className="text-sm text-gray-700 line-clamp-3"
                         
                      >
                          {article.content_blocks[0].paragraph}
                        </p>
                      )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
