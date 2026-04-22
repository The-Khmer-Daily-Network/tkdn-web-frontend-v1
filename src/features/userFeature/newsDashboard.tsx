"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { News } from "@/types/news";

interface NewsDashboardProps {
  allNews?: News[];
  loading?: boolean;
}

type UserArticleDashboardResponse = {
  success: boolean;
  data: News[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function getApiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not defined in environment variables",
    );
  }

  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  const apiPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${apiPath}`;
}

export default function NewsDashboard({
  allNews = [],
  loading = false,
}: NewsDashboardProps) {
  const [news, setNews] = useState<News[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize(); // Set initial width
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (allNews.length > 0) {
      // Filter news with cover images only
      const newsWithImages = allNews.filter(
        (article) => article.cover !== null,
      );

      // Sort by date_time_post (latest first) and take 6
      const latestNews = newsWithImages
        .sort(
          (a, b) =>
            new Date(b.date_time_post).getTime() -
            new Date(a.date_time_post).getTime(),
        )
        .slice(0, 6);

      setNews(latestNews);
    }
  }, [allNews]);

  useEffect(() => {
    if (allNews.length > 0) return;
    if (!API_BASE_URL) return;

    const controller = new AbortController();

    async function load() {
      try {
        setInternalLoading(true);
        const url = getApiUrl("/user/article-dashboard");
        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "omit",
          mode: "cors",
          signal: controller.signal,
        });

        if (!res.ok) return;

        const json = (await res.json()) as UserArticleDashboardResponse;
        const items = Array.isArray(json?.data) ? json.data : [];

        // UI only needs: cover, title, category.name, date_time_post, content_blocks[0].paragraph
        const newsWithImages = items.filter((article) => article.cover !== null);
        const latestNews = newsWithImages
          .sort(
            (a, b) =>
              new Date(b.date_time_post).getTime() -
              new Date(a.date_time_post).getTime(),
          )
          .slice(0, 6);

        setNews(latestNews);
      } catch {
        // Keep quiet: dashboard can still render "No news available"
      } finally {
        setInternalLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [allNews.length]);

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

  if (loading || internalLoading) {
    return (
      <div className="w-full space-y-6">
        {/* Main Article Skeleton */}
        <div className="w-full">
          {/* Mobile: Full width image with text below */}
          <div className="flex flex-col space-y-2 sm:hidden animate-pulse">
            {/* Main Article Image Skeleton */}
            <div
              className="relative w-full rounded-[10px] bg-gray-200"
              style={{ height: "200px" }}
          ></div>

            {/* Main Article Info Skeleton */}
            <div className="flex flex-col space-y-1">
              <div className="h-4 bg-gray-200 rounded-[10px] w-20"></div>
              <div className="h-4 bg-gray-200 rounded-[10px] w-32"></div>
              <div className="h-5 bg-gray-200 rounded-[10px] w-full"></div>
              <div className="h-5 bg-gray-200 rounded-[10px] w-3/4"></div>
            </div>
          </div>

          {/* Desktop/Tablet: Original style skeleton */}
          <div className="hidden sm:flex flex-col sm:flex-row gap-4 sm:gap-6 bg-[#273C8F]/10 rounded-[10px] animate-pulse">
            {/* Main Article Image Skeleton */}
            <div
              className="relative rounded-[10px] bg-gray-200"
              style={{ width: "500px", height: "275px" }}
          ></div>

            {/* Main Article Content Skeleton */}
            <div className="w-full sm:w-1/2 flex flex-col justify-start mt-4 space-y-6">
              <div>
                <div className="h-5 bg-gray-200 rounded-[10px] w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-[10px] w-40"></div>
              </div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded-[10px] w-full"></div>
                <div className="h-6 bg-gray-200 rounded-[10px] w-5/6"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded-[10px] w-full"></div>
                <div className="h-4 bg-gray-200 rounded-[10px] w-full"></div>
                <div className="h-4 bg-gray-200 rounded-[10px] w-4/5"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Other Articles Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse">
              {/* Mobile: Horizontal layout skeleton */}
              <div className="flex flex-row gap-3 sm:flex-col sm:space-y-0">
                {/* Article Image Skeleton */}
                <div className="relative max-[400px]:w-[150px] max-[400px]:h-[90px] w-[200px] h-[120px] sm:w-full sm:h-[100px] shrink-0 rounded-[10px] bg-gray-200"></div>

                {/* Article Info Skeleton */}
                <div className="flex-1 sm:flex-none flex flex-col justify-center sm:justify-start sm:space-y-1 space-y-1">
                  <div className="h-3 bg-gray-200 rounded-[10px] w-16"></div>
                  <div className="h-3 bg-gray-200 rounded-[10px] w-24 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded-[10px] w-full"></div>
                  <div className="h-4 bg-gray-200 rounded-[10px] w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">News is Loading...</p>
      </div>
    );
  }

  const mainArticle = news[0];
  const otherArticles = news.slice(1, 6);

  // Show only 3 articles when screen width is up to 1279px (total 4 including main)
  // Above 1280px, show all 5 articles (total 6 including main)
  const displayedArticles =
    windowWidth !== null && windowWidth <= 1279
      ? otherArticles.slice(0, 3)
      : otherArticles;

  return (
    <div className="w-full space-y-6">
      {/* Main Article */}
      {mainArticle && (
        <Link href={`/news/${mainArticle.id}`} className="w-full block">
          <article className="w-full">
            {/* Mobile: Full width image with text below */}
            <div className="flex flex-col space-y-2 cursor-pointer hover:opacity-90 transition-opacity sm:hidden">
              {/* Main Article Image */}
              <div
                className="relative w-full rounded-xl overflow-hidden bg-gray-200 group"
                style={{ height: "200px" }}
            >
                {mainArticle.cover && (
                  <img
                    src={mainArticle.cover}
                    alt={mainArticle.title}
                    className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>

              {/* Main Article Info */}
              <div className="flex flex-col space-y-1">
                {mainArticle.category && (
                  <span
                    className="text-xs max-[481px]:text-[10px] font-semibold text-[#1D2229] underline decoration-[#E34C33] decoration-2 underline-offset-5 uppercase"
                   
                >
                    {mainArticle.category.name}
                  </span>
                )}
                <p className="text-xs text-[#1D2229] font-medium">
                  {formatDate(mainArticle.date_time_post)}
                </p>
                <h1
                  className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight"
                 
              >
                  {mainArticle.title}
                </h1>
              </div>
            </div>

            {/* Desktop/Tablet: Original style */}
            <div className="hidden sm:flex flex-col sm:flex-row gap-4 sm:gap-6 bg-[#273C8F]/10 rounded-[10px] cursor-pointer hover:opacity-90 transition-opacity">
              {/* Main Article Image */}
              <div
                className="relative rounded-xl overflow-hidden bg-gray-200 group"
                style={{ width: "500px", height: "275px" }}
            >
                {mainArticle.cover && (
                  <img
                    src={mainArticle.cover}
                    alt={mainArticle.title}
                    className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>

              {/* Main Article Content */}
              <div className="w-full sm:w-1/2 flex flex-col justify-start mt-4 space-y-6">
                <div>
                  {mainArticle.category && (
                    <span
                      className="inline-block text-sm font-semibold text-[#1D2229] underline decoration-[#E34C33] decoration-3 underline-offset-5 uppercase"
                     
                  >
                      {mainArticle.category.name}
                    </span>
                  )}
                  <p className="text-xs text-[#1D2229] mt-2 font-medium">
                    {formatDate(mainArticle.date_time_post)}
                  </p>
                </div>
                <div className="space-y-2">
                  <h1
                    className="text-base lg:text-lg xl:text-xl font-semibold text-[#1D2229] leading-tight"
                    
                >
                    {mainArticle.title}
                  </h1>
                </div>
                {mainArticle.content_blocks &&
                  mainArticle.content_blocks.length > 0 && (
                    <p
                      className="text-xs text-gray-700 line-clamp-3"
                     
                  >
                      {mainArticle.content_blocks[0].paragraph}
                    </p>
                  )}
              </div>
            </div>
          </article>
        </Link>
      )}

      {/* Other Articles Grid */}
      {displayedArticles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {displayedArticles.map((article) => (
            <Link
              key={article.id}
              href={`/news/${article.id}`}
              className="cursor-pointer hover:opacity-90 transition-opacity"
          >
              {/* Mobile: Horizontal layout - image left, content right */}
              <div className="flex flex-row gap-3 sm:flex-col sm:space-y-0">
                {/* Article Image */}
                <div className="relative max-[400px]:w-[150px] max-[400px]:h-[90px] w-[200px] h-[120px] sm:w-full sm:h-[100px] shrink-0 rounded-xl overflow-hidden bg-gray-200 group">
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
                </div>

                {/* Article Info */}
                <div className="flex-1 sm:flex-none flex flex-col justify-center sm:justify-start sm:space-y-1 space-y-1">
                  {article.category && (
                    <span
                      className="text-xs font-semibold text-[#1D2229] underline decoration-[#E34C33] decoration-2 underline-offset-5 uppercase"
                     
                  >
                      {article.category.name}
                    </span>
                  )}
                  <p className="text-xs text-[#1D2229] font-regular mb-2">
                    {formatDate(article.date_time_post)}
                  </p>
                  <h2
                    className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight"
                   
                >
                    {article.title}
                  </h2>
                  {/* {article.content_blocks &&
                    article.content_blocks.length > 0 && (
                      <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                        {article.content_blocks[0].paragraph}
                      </p>
                    )} */}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
