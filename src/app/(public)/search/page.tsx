"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getNews } from "@/services/news";
import type { News } from "@/types/news";
import { Play } from "lucide-react";
import SEO from "@/components/SEO";
import { getNewsPath } from "@/utils/newsSlug";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to track if fetch has been called to prevent duplicate calls in React Strict Mode
  const hasFetchedRef = useRef<string | null>(null);

  const fetchSearchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all news
      const response = await getNews();

      // Filter news by title (case-insensitive)
      const searchTerm = query.toLowerCase().trim();
      const filteredNews = response.data.filter((article) => {
        if (!article.title) return false;
        return article.title.toLowerCase().includes(searchTerm);
      });

      // Sort by date_time_post (newest first)
      const sortedNews = filteredNews.sort((a, b) => {
        const dateA = new Date(a.date_time_post).getTime();
        const dateB = new Date(b.date_time_post).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      setNews(sortedNews);
    } catch (err) {
      console.error("Error fetching search results:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch search results",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode (development)
    if (query && hasFetchedRef.current !== query) {
      hasFetchedRef.current = query;
      fetchSearchResults();
    } else if (!query) {
      setNews([]);
      setLoading(false);
      hasFetchedRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

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

  // Generate SEO metadata
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const currentUrl = `${baseUrl}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`;

  if (loading) {
    return (
      <>
        <SEO
          title={`Search Results${query ? `: ${query}` : ""} - The Khmer Daily Network`}
          description={`Search results for "${query}" on The Khmer Daily Network. Find news articles and stories matching your search.`}
          subtitle={`Searching for "${query}"...`}
          keywords={`search, ${query}, news, articles, The Khmer Daily Network`}
          url={currentUrl}
        />
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Searching...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SEO
          title="Search - The Khmer Daily Network"
          description="Search for news articles on The Khmer Daily Network."
          subtitle="Search for news and articles"
          keywords="search, news, articles, The Khmer Daily Network"
          url={currentUrl}
        />
        <div className="flex items-center justify-center py-12">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={`Search Results${query ? `: ${query}` : ""} - The Khmer Daily Network`}
        description={`Search results for "${query}" on The Khmer Daily Network. Found ${news.length} ${news.length === 1 ? "article" : "articles"} matching your search.`}
        subtitle={`Found ${news.length} ${news.length === 1 ? "result" : "results"} for "${query}"`}
        keywords={`search, ${query}, news, articles, The Khmer Daily Network`}
        url={currentUrl}
      />
      <div className="w-full space-y-6">
        {/* Search Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-[#1D2229]">
            Search Results{query ? `: "${query}"` : ""}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {query
              ? `${news.length} ${news.length === 1 ? "article" : "articles"} found`
              : "Enter a search term to find news articles"}
          </p>
        </div>

        {/* Search Results */}
        {!query ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600">Please enter a search term</p>
          </div>
        ) : news.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600">
              No articles found matching "{query}"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((article) => (
              <Link
                key={article.id}
                href={getNewsPath(article)}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  window.location.href = getNewsPath(article);
                }}
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
                    <span className="text-xs font-medium text-[#E34C33]">
                      {article.category.name}
                    </span>
                  )}
                  <p className="text-xs text-[#1D2229] font-medium">
                    {formatDate(article.date_time_post)}
                  </p>
                  <h2 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
                    {article.title}
                  </h2>
                  {article.subtitle && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {article.subtitle}
                    </p>
                  )}
                  {article.content_blocks &&
                    article.content_blocks.length > 0 && (
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {article.content_blocks[0].paragraph}
                      </p>
                    )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <>
          <SEO
            title="Search - The Khmer Daily Network"
            description="Search for news articles on The Khmer Daily Network."
            subtitle="Search for news and articles"
            keywords="search, news, articles, The Khmer Daily Network"
            url={`${typeof window !== "undefined" ? window.location.origin : ""}/search`}
          />
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        </>
      }
  >
      <SearchContent />
    </Suspense>
  );
}
