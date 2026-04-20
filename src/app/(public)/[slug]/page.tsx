"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getNews } from "@/services/news";
import { getCategories } from "@/services/category";
import { categoryNameToSlug } from "@/utils/slug";
import type { News } from "@/types/news";
import type { Category } from "@/types/category";
import { Play, FileText } from "lucide-react";
import SEO from "@/components/SEO";
import BannerSponsor from "@/features/sponsor/bannerSponsor";

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [news, setNews] = useState<News[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to track if fetch has been called to prevent duplicate calls in React Strict Mode
  const hasFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode (development)
    if (slug && hasFetchedRef.current !== slug) {
      hasFetchedRef.current = slug;
      fetchCategoryData();
    }
  }, [slug]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      const slugLower = slug.toLowerCase().trim();

      // Check if it's the "latest" route (not a category)
      if (slugLower === "latest") {
        // Fetch all latest news sorted by date
        await fetchLatestNews();
        return;
      }

      // Check if it's the "video" route (not a category)
      if (slugLower === "video") {
        // Fetch all news with video URL
        await fetchVideoNews();
        return;
      }

      const response = await getCategories();

      // Find category by matching slug
      let foundCategory: Category | null = null;

      // Search through main categories first
      for (const cat of response.categories) {
        const catSlug = categoryNameToSlug(cat.name).toLowerCase();
        const catNameLower = cat.name.toLowerCase().trim();

        if (catSlug === slugLower || catNameLower === slugLower) {
          // Found main category - will include all subcategories via backend
          foundCategory = cat;
          break;
        }

        // Check subcategories
        for (const subcat of cat.subcategories) {
          const subcatSlug = categoryNameToSlug(subcat.name).toLowerCase();
          const subcatNameLower = subcat.name.toLowerCase().trim();

          if (subcatSlug === slugLower || subcatNameLower === slugLower) {
            // Found subcategory - will show only this subcategory via backend
            foundCategory = {
              id: subcat.id,
              name: subcat.name,
              parent_id: subcat.parent_id,
              subcategories: [], // Empty array indicates it's a subcategory
            };
            break;
          }
        }
        if (foundCategory) break;
      }

      if (foundCategory) {
        setCategory(foundCategory);
        // Fetch news with the category ID
        // Backend will automatically:
        // - For main categories: include main + all subcategories
        // - For subcategories: include only that subcategory
        await fetchNews(foundCategory);
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

  const fetchNews = async (targetCategory: Category) => {
    if (!targetCategory) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch news from backend
      const response = await getNews(targetCategory.id);

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
        allowedCategoryIds = [targetCategory.id];
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

  if (loading) {
    return (
      <>
        <SEO
          title="Loading - The Khmer Daily Network"
          description="Loading news articles..."
          keywords="news, articles, The Khmer Daily Network"
        />
        <BannerSponsor />
        <div className="w-full space-y-6 mt-4">
          {/* Header Skeleton */}

          {/* Mobile: List View Skeleton */}
          <div className="space-y-4 md:hidden">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex flex-row gap-4 animate-pulse">
                {/* Article Image Skeleton - Smaller on mobile (max-400px) */}
                <div className="relative max-[400px]:w-[150px] max-[400px]:h-[90px] w-[200px] h-[120px] shrink-0 rounded-[10px] bg-gray-200"></div>

                {/* Article Info Skeleton */}
                <div className="flex-1 flex flex-col justify-center space-y-2">
                  <div className="flex flex-row space-x-5">
                    <div className="h-3 bg-gray-200 rounded-[10px] w-20"></div>
                    <div className="h-3 bg-gray-200 rounded-[10px] w-24"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-[10px] w-full"></div>
                  <div className="h-4 bg-gray-200 rounded-[10px] w-5/6"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Grid View Skeleton */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="flex flex-col space-y-3 animate-pulse"
              >
                {/* Article Image Skeleton */}
                <div className="relative w-full h-[200px] rounded-[10px] bg-gray-200"></div>

                {/* Article Info Skeleton */}
                <div className="flex flex-col space-y-2">
                  <div className="h-4 bg-gray-200 rounded-[10px] w-20"></div>
                  <div className="h-4 bg-gray-200 rounded-[10px] w-24"></div>
                  <div className="h-5 bg-gray-200 rounded-[10px] w-full"></div>
                  <div className="h-5 bg-gray-200 rounded-[10px] w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded-[10px] w-full"></div>
                  <div className="h-4 bg-gray-200 rounded-[10px] w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
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
    const currentUrl = `${baseUrl}/${slug}`;

    if (category) {
      return {
        title: `${category.name} - The Khmer Daily Network`,
        description: `Browse ${category.name} news and articles on The Khmer Daily Network. Stay updated with the latest ${category.name.toLowerCase()} stories, breaking news, and in-depth coverage.`,
        subtitle: `Find the latest ${category.name} news, articles, and updates. ${news.length} ${news.length === 1 ? "article" : "articles"} available.`,
        keywords: `${category.name}, news, articles, The Khmer Daily Network, Cambodia, Khmer news`,
        url: currentUrl,
      };
    } else if (slug?.toLowerCase() === "latest") {
      return {
        title: "Latest News - The Khmer Daily Network",
        description:
          "Stay updated with the latest news and breaking stories from The Khmer Daily Network. Get real-time updates on national, international, and local news.",
        subtitle: `Discover the most recent news articles and stories. ${news.length} ${news.length === 1 ? "article" : "articles"} available.`,
        keywords:
          "latest news, breaking news, current events, The Khmer Daily Network, Cambodia news, Khmer news",
        url: currentUrl,
      };
    } else if (slug?.toLowerCase() === "video") {
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
    };
  };

  const seoData = getSEOMetadata();

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
      <BannerSponsor />
      <div className="w-full space-y-6 mt-4">
        {/* Category Header, Latest Header, or Video Header */}
        {category ? (
          <div className="border-b border-gray-200 pb-4">
            <h1
              className="text-2xl font-bold text-[#1D2229]"
              style={{ fontFamily: "Hanuman" }}
            >
              {category.name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {news.length} {news.length === 1 ? "article" : "articles"} found
            </p>
          </div>
        ) : slug?.toLowerCase() === "latest" ? (
          <div className="border-b border-gray-200 pb-4">
            <h1 className="text-2xl font-bold text-[#1D2229]">Latest News</h1>
            <p className="text-sm text-gray-600 mt-1">
              {news.length} {news.length === 1 ? "article" : "articles"} found
            </p>
          </div>
        ) : slug?.toLowerCase() === "video" ? (
          <div className="border-b border-gray-200 pb-4">
            <h1 className="text-2xl font-bold text-[#1D2229]">News Video</h1>
            <p className="text-sm text-gray-600 mt-1">
              {news.length} {news.length === 1 ? "video" : "videos"} found
            </p>
          </div>
        ) : null}

        {/* News List/Grid */}
        {news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium mb-2">
              No news available
            </p>
            <p className="text-gray-500 text-sm text-center max-w-md">
              {category
                ? `We couldn't find any articles in the "${category.name}" category at the moment.`
                : "We couldn't find any articles at the moment. Please check back later."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: List View (max-width: 767px) - Small cards */}
            <div className="space-y-4 md:hidden">
              {news.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.id}`}
                  className="flex flex-row gap-4 cursor-pointer hover:opacity-90 transition-opacity"
                >
                  {/* Article Image - Smaller on mobile (max-400px) */}
                  <div className="relative max-[400px]:w-[150px] max-[400px]:h-[90px] w-[200px] h-[120px] shrink-0 rounded-lg overflow-hidden bg-gray-200 group">
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

                  {/* Article Info - Mobile: simplified */}
                  <div className="flex-1 flex flex-col justify-center space-y-2">
                    <div className="flex flex-row space-x-5 max-[481px]:flex-col max-[481px]:space-x-0 max-[481px]:space-y-1">
                      {article.category && (
                        <span
                          className="text-xs max-[481px]:text-[10px] font-semibold text-[#1D2229] underline decoration-[#E34C33] decoration-2 underline-offset-5 uppercase"
                          style={{ fontFamily: "Hanuman" }}
                        >
                          {article.category.name}
                        </span>
                      )}
                      <p
                        className="text-xs max-[481px]:text-[10px] font-medium"
                        style={{
                          fontFamily: "Hanuman",
                          color: "rgba(29, 34, 41, 0.6784)",
                        }}
                      >
                        {formatDate(article.date_time_post)}
                      </p>
                    </div>
                    <h2
                      className="text-lg max-[481px]:text-sm font-semibold text-gray-900 line-clamp-2 leading-tight"
                      style={{ fontFamily: "Hanuman" }}
                    >
                      {article.title}
                    </h2>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop: Grid View (min-width: 768px) - Original larger cards */}
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
                        style={{ fontFamily: "Hanuman" }}
                      >
                        {article.category.name}
                      </span>
                    )}
                    <p className="text-xs text-[#1D2229] font-medium">
                      {formatDate(article.date_time_post)}
                    </p>
                    <h2
                      className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight"
                      style={{ fontFamily: "Hanuman" }}
                    >
                      {article.title}
                    </h2>
                    {article.subtitle && (
                      <p
                        className="text-sm text-gray-600 line-clamp-2"
                        style={{ fontFamily: "Hanuman" }}
                      >
                        {article.subtitle}
                      </p>
                    )}
                    {article.content_blocks &&
                      article.content_blocks.length > 0 && (
                        <p
                          className="text-sm text-gray-700 line-clamp-3"
                          style={{ fontFamily: "Hanuman" }}
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
