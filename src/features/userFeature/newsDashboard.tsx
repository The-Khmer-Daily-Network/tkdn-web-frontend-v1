"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { News } from "@/types/news";
import { getNewsPath } from "@/utils/newsSlug";

interface NewsDashboardProps {
  allNews?: News[];
  loading?: boolean;
  disableFetch?: boolean;
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

function getPlainPreviewText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export default function NewsDashboard({
  allNews = [],
  loading = false,
  disableFetch = false,
}: NewsDashboardProps) {
  const [news, setNews] = useState<News[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    if (allNews.length > 0) {
      // Filter news with cover images only
      const newsWithImages = allNews.filter(
        (article) => article.cover !== null,
      );

      // Sort by date_time_post (latest first) and take 8
      const latestNews = newsWithImages
        .sort(
          (a, b) =>
            new Date(b.date_time_post).getTime() -
            new Date(a.date_time_post).getTime(),
        )
        .slice(0, 8);

      setNews(latestNews);
    }
  }, [allNews]);

  useEffect(() => {
    if (allNews.length > 0) return;
    if (disableFetch) return;
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
          .slice(0, 8);

        setNews(latestNews);
      } catch {
        // Keep quiet: dashboard can still render "No news available"
      } finally {
        setInternalLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [allNews.length, disableFetch]);

  const getRelativeTimeShort = (dateString: string) => {
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? "min" : "mins"} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hr" : "hrs"} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  };

  if (loading || internalLoading) {
    return (
      <div className="w-full space-y-6">
        <div className="w-full">
          <div className="flex flex-col space-y-2 sm:hidden animate-pulse">
            <div
              className="relative w-full rounded-[10px] bg-gray-200"
              style={{ height: "200px" }}
            ></div>

            <div className="flex flex-col space-y-1">
              <div className="h-4 bg-gray-200 rounded-[10px] w-20"></div>
              <div className="h-4 bg-gray-200 rounded-[10px] w-32"></div>
              <div className="h-5 bg-gray-200 rounded-[10px] w-full"></div>
              <div className="h-5 bg-gray-200 rounded-[10px] w-3/4"></div>
            </div>
          </div>

          <div className="hidden sm:flex flex-col sm:flex-row gap-4 sm:gap-6 bg-[#273C8F]/10 rounded-[10px] animate-pulse">
            <div
              className="relative rounded-[10px] bg-gray-200"
              style={{ width: "500px", height: "275px" }}
            ></div>

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

        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }, (_, index) => index + 1).map((item) => (
            <div key={item} className="animate-pulse">
              <div className="flex flex-row gap-3 sm:flex-col sm:space-y-0">
                <div className="relative max-[400px]:w-[150px] max-[400px]:h-[90px] w-[200px] h-[120px] sm:w-full sm:h-[100px] shrink-0 rounded-[10px] bg-gray-200"></div>

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
        <p className="text-gray-600">No latest news available</p>
      </div>
    );
  }

  const mainArticle = news[0];
  const otherArticles = news.slice(1);

  const displayedArticles = otherArticles.slice(2, 5);

  return (
    <div className="w-full space-y-6">
      {/* Top grid: large feature on left, stacked highlights on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {mainArticle && (
          <div className="lg:col-span-2">
            <Link
              href={getNewsPath(mainArticle)}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                window.location.href = getNewsPath(mainArticle);
              }}
              className="block group"
            >
              <article className="relative rounded-[12px] overflow-hidden bg-gray-200">
                <div className="relative w-full" style={{ height: "520px" }}>
                  {mainArticle.cover && (
                    <Image
                      src={mainArticle.cover}
                      alt={mainArticle.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 800px"
                      className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>

                  <div className="absolute left-6 bottom-6 right-6 text-white">
                    <div className="mb-2 flex items-center gap-2 flex-wrap">
                      <span className="inline-block text-sm font-semibold uppercase tracking-wider text-[#F3F4F6] border-b-2 border-[#E34C33] pb-1">
                        {mainArticle.category?.name ?? "News"}
                      </span>
                      <span className="text-xs text-white/80">
                        - {getRelativeTimeShort(mainArticle.date_time_post)}
                      </span>
                    </div>
                    <h2 className="mt-3 text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight">
                      {mainArticle.title}
                    </h2>
                    {mainArticle.content_blocks && mainArticle.content_blocks.length > 0 && (
                      <p className="mt-3 max-w-2xl text-sm text-white/90 line-clamp-3">
                        {getPlainPreviewText(mainArticle.content_blocks[0].paragraph)}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="h-[520px] flex flex-col gap-4">
            {otherArticles.slice(0, 2).map((article) => (
              <Link
                key={article.id}
                href={getNewsPath(article)}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  window.location.href = getNewsPath(article);
                }}
                className="block group rounded-[10px] overflow-hidden bg-gray-100 flex-1"
              >
                <div className="relative h-full">
                  {article.cover && (
                    <Image
                      src={article.cover}
                      alt={article.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 300px"
                      className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute left-4 bottom-4 right-4 text-white">
                    <div className="mb-1 flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold uppercase tracking-wider inline-block border-b-2 border-[#E34C33] pb-1">
                        {article.category?.name ?? "News"}
                      </span>
                      <span className="text-[11px] text-white/80">
                        - {getRelativeTimeShort(article.date_time_post)}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold leading-tight line-clamp-2">
                      {article.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* two-up cards moved to bottom row; nothing to render here */}
        </div>
      </div>

      {/* Bottom row: remaining small thumbnails */}
      {displayedArticles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedArticles.map((article) => (
            <Link
              key={article.id}
              href={getNewsPath(article)}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                window.location.href = getNewsPath(article);
              }}
              className="block group cursor-pointer transition-opacity hover:opacity-95"
            >
              <div className="relative rounded-[12px] overflow-hidden bg-gray-200 shadow-sm h-[210px] sm:h-[240px]">
                <div className="absolute inset-0 bg-gray-200">
                  {article.cover && (
                    <Image
                      src={article.cover}
                      alt={article.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 280px"
                      className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white">
                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-white/90 border-b-2 border-[#E34C33] pb-1">
                        {article.category?.name ?? "News"}
                      </span>
                      <span className="text-[11px] text-white/80">
                        - {getRelativeTimeShort(article.date_time_post)}
                      </span>
                    </div>
                    <h2 className="text-sm sm:text-base font-bold leading-tight line-clamp-2">
                      {article.title}
                    </h2>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
