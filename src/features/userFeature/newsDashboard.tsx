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
  const [windowWidth, setWindowWidth] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize();
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
  }, [allNews.length, disableFetch]);

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
  const otherArticles = news.slice(1, 6);

  const displayedArticles =
    windowWidth !== null && windowWidth <= 1279
      ? otherArticles.slice(0, 3)
      : otherArticles;

  return (
    <div className="w-full space-y-6">
      {mainArticle && (
        <Link
          href={getNewsPath(mainArticle)}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            e.preventDefault();
            window.location.href = getNewsPath(mainArticle);
          }}
          className="w-full block"
        >
          <article className="w-full">
            <div className="flex flex-col space-y-2 cursor-pointer hover:opacity-90 transition-opacity sm:hidden">
              <div
                className="relative w-full rounded-xl overflow-hidden bg-gray-200 group"
                style={{ height: "200px" }}
              >
                {mainArticle.cover && (
                  <Image
                    src={mainArticle.cover}
                    alt={mainArticle.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 500px"
                    className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                    unoptimized
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>

              <div className="flex flex-col space-y-1">
                {mainArticle.category && (
                  <span className="text-xs max-[481px]:text-[10px] font-semibold text-[#1D2229] underline decoration-[#E34C33] decoration-2 underline-offset-5 uppercase">
                    {mainArticle.category.name}
                  </span>
                )}
                <p className="text-xs text-[#1D2229] font-medium">
                  {formatDate(mainArticle.date_time_post)}
                </p>
                <h1 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                  {mainArticle.title}
                </h1>
              </div>
            </div>

            <div className="hidden sm:flex flex-col sm:flex-row gap-4 sm:gap-6 bg-[#273C8F]/10 rounded-[10px] cursor-pointer hover:opacity-90 transition-opacity">
              <div
                className="relative rounded-xl overflow-hidden bg-gray-200 group"
                style={{ width: "500px", height: "275px" }}
              >
                {mainArticle.cover && (
                  <Image
                    src={mainArticle.cover}
                    alt={mainArticle.title}
                    fill
                    sizes="500px"
                    className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                    unoptimized
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>

              <div className="w-full sm:w-1/2 flex flex-col justify-start mt-4 space-y-6">
                <div>
                  {mainArticle.category && (
                    <span className="inline-block text-sm font-semibold text-[#1D2229] underline decoration-[#E34C33] decoration-3 underline-offset-5 uppercase">
                      {mainArticle.category.name}
                    </span>
                  )}
                  <p className="text-xs text-[#1D2229] mt-2 font-medium">
                    {formatDate(mainArticle.date_time_post)}
                  </p>
                </div>
                <div className="space-y-2">
                  <h1 className="line-clamp-2 text-base lg:text-lg xl:text-xl font-semibold text-[#1D2229] leading-tight">
                    {mainArticle.title}
                  </h1>
                </div>
                {mainArticle.content_blocks &&
                  mainArticle.content_blocks.length > 0 && (
                    <p className="text-xs text-gray-700 line-clamp-3">
                      {getPlainPreviewText(mainArticle.content_blocks[0].paragraph)}
                    </p>
                  )}
              </div>
            </div>
          </article>
        </Link>
      )}

      {displayedArticles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {displayedArticles.map((article) => (
            <Link
              key={article.id}
              href={getNewsPath(article)}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                window.location.href = getNewsPath(article);
              }}
              className="cursor-pointer hover:opacity-90 transition-opacity"
            >
              <div className="flex flex-row gap-3 sm:flex-col sm:space-y-0">
                <div className="relative max-[400px]:w-[150px] max-[400px]:h-[90px] w-[200px] h-[120px] sm:w-full sm:h-[100px] shrink-0 rounded-xl overflow-hidden bg-gray-200 group">
                  {article.cover && (
                    <Image
                      src={article.cover}
                      alt={article.title}
                      fill
                      sizes="(max-width: 400px) 150px, (max-width: 640px) 200px, 200px"
                      className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>

                <div className="flex-1 sm:flex-none flex flex-col justify-center sm:justify-start sm:space-y-1 space-y-1">
                  {article.category && (
                    <span className="text-xs font-semibold text-[#1D2229] underline decoration-[#E34C33] decoration-2 underline-offset-5 uppercase">
                      {article.category.name}
                    </span>
                  )}
                  <p className="text-xs text-[#1D2229] font-regular mb-2">
                    {formatDate(article.date_time_post)}
                  </p>
                  <h2 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                    {article.title}
                  </h2>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
