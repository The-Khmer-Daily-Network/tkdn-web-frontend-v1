"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { News } from "@/types/news";
import { getNationalNews } from "@/services/news";
import { getNewsPath } from "@/utils/newsSlug";
import { stripHtmlToText } from "@/utils/text";

const DISPLAY_LIMIT = 15;

// Stable empty array so effect deps don't change every render when parent doesn't pass allNews
const EMPTY_NEWS: News[] = [];

interface NationalFeatureProps {
  allNews?: News[];
  loading?: boolean;
  disableFetch?: boolean;
}

type NationalResponse = { success: boolean; data: News[] };

export default function NationalFeature({
  allNews,
  loading: externalLoading = false,
  disableFetch = false,
}: NationalFeatureProps) {
  const resolvedAllNews = allNews ?? EMPTY_NEWS;
  const [news, setNews] = useState<News[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    if (resolvedAllNews.length > 0) {
      const nationalNews = resolvedAllNews.filter(
        (article) =>
          article.category?.name === "National" && article.cover !== null,
      );
      const sorted = nationalNews
        .sort(
          (a, b) =>
            new Date(b.date_time_post).getTime() -
            new Date(a.date_time_post).getTime(),
        )
        .slice(0, DISPLAY_LIMIT);
      setNews(sorted);
      return;
    }

    if (disableFetch) return;

    let cancelled = false;
    setInternalLoading(true);
    getNationalNews()
      .then((res: NationalResponse) => {
        if (cancelled) return;
        const items = Array.isArray(res?.data) ? res.data : [];
        const withCover = items.filter((a) => a.cover != null);
        const sorted = withCover
          .sort(
            (a, b) =>
              new Date(b.date_time_post).getTime() -
              new Date(a.date_time_post).getTime(),
          )
          .slice(0, DISPLAY_LIMIT);
        setNews(sorted);
      })
      .catch((err) => {
        if (!cancelled) console.error("Error fetching national news:", err);
      })
      .finally(() => {
        if (!cancelled) setInternalLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedAllNews, disableFetch]);

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

  const loading = externalLoading || internalLoading;

  if (loading) {
    return (
      <div className="w-full">
        <div className="h-7 bg-gray-200 rounded-[10px] w-48 mb-3 animate-pulse"></div>
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, index) => index + 1).map((item) => (
            <div key={item} className="flex flex-row gap-4 animate-pulse">
              <div className="relative max-[400px]:w-[150px] w-[200px] sm:w-[250px] h-[140px] shrink-0 rounded-[10px] bg-gray-200"></div>
              <div className="hidden sm:flex flex-1 flex-col justify-center space-y-3">
                <div className="flex flex-row space-x-5">
                  <div className="h-3 bg-gray-200 rounded-[10px] w-20"></div>
                  <div className="h-3 bg-gray-200 rounded-[10px] w-24"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded-[10px] w-full"></div>
                <div className="h-5 bg-gray-200 rounded-[10px] w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded-[10px] w-full"></div>
                <div className="h-4 bg-gray-200 rounded-[10px] w-5/6"></div>
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
        <p className="text-gray-600">No national news available</p>
      </div>
    );
  }

  const featuredArticle = news[0];
  const sideArticles = news.slice(1, 5);
  const remainingArticles = news.slice(5);

  return (
    <div className="w-full">
      <h2
        className="text-xl font-bold text-[#E34C33] mb-3"
       
    >
        National News
      </h2>
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-stretch">
          {featuredArticle && (
            <Link
              href={getNewsPath(featuredArticle)}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                window.location.href = getNewsPath(featuredArticle);
              }}
              className="xl:col-span-3 block group"
            >
              <article className="relative h-[340px] sm:h-[420px] lg:h-[520px] rounded-[12px] overflow-hidden bg-gray-200">
                {featuredArticle.cover && (
                  <Image
                    src={featuredArticle.cover}
                    alt={featuredArticle.title}
                    fill
                    sizes="(max-width: 1280px) 100vw, 68vw"
                    className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                    unoptimized
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent"></div>

                <div className="absolute left-5 right-5 bottom-5 text-white">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-block text-sm font-semibold uppercase tracking-wider border-b-2 border-[#E34C33] pb-1">
                      {featuredArticle.category?.name ?? "News"}
                    </span>
                    <span className="text-sm text-white/80">
                      - {getRelativeTimeShort(featuredArticle.date_time_post)}
                    </span>
                  </div>
                  <h3 className="mt-3 text-3xl max-[481px]:text-2xl font-black leading-tight line-clamp-3">
                    {featuredArticle.title}
                  </h3>
                  {featuredArticle.content_blocks && featuredArticle.content_blocks.length > 0 && (
                    <p className="mt-3 text-base max-[481px]:text-sm text-white/90 line-clamp-3">
                      {stripHtmlToText(featuredArticle.content_blocks[0].paragraph)}
                    </p>
                  )}
                </div>
              </article>
            </Link>
          )}

          <div className="xl:col-span-2 h-[520px] flex flex-col gap-4">
            {sideArticles.map((article) => (
              <Link
                key={article.id}
                href={getNewsPath(article)}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  window.location.href = getNewsPath(article);
                }}
                className="flex flex-1 min-h-0 gap-4 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <div className="relative w-[170px] sm:w-[190px] h-full shrink-0 rounded-[8px] overflow-hidden bg-gray-200 group">
                  {article.cover && (
                    <Image
                      src={article.cover}
                      alt={article.title}
                      fill
                      sizes="(max-width: 640px) 170px, 190px"
                      className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-semibold text-[#1D2229] uppercase tracking-[0.12em] underline decoration-[#E34C33] decoration-2 underline-offset-4">
                      {article.category?.name ?? "News"}
                    </span>
                    <span className="text-[12px]" style={{ color: "rgba(29, 34, 41, 0.6784)" }}>
                      - {getRelativeTimeShort(article.date_time_post)}
                    </span>
                  </div>
                  <h3 className="text-base max-[1280px]:text-sm max-[1024px]:text-[13px] max-[640px]:text-[12px] font-semibold text-[#1D2229] leading-tight line-clamp-2">
                    {article.title}
                  </h3>
                  {article.content_blocks && article.content_blocks.length > 0 && (
                    <p className="text-xs max-[640px]:text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                      {stripHtmlToText(article.content_blocks[0].paragraph)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {remainingArticles.length > 0 && (
          <div className="space-y-4">
            {remainingArticles.map((article) => (
              <Link
                key={article.id}
                href={getNewsPath(article)}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  window.location.href = getNewsPath(article);
                }}
                className="flex flex-row gap-4 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <div className="relative max-[400px]:w-[150px] w-[200px] sm:w-[250px] h-[140px] shrink-0 rounded-xl overflow-hidden bg-gray-200 group">
                  {article.cover && (
                    <Image
                      src={article.cover}
                      alt={article.title}
                      fill
                      sizes="(max-width: 640px) 200px, 250px"
                      className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center space-y-2">
                  <div className="flex items-center gap-2 max-[481px]:flex-col max-[481px]:items-start max-[481px]:gap-1">
                    <span className="text-xs max-[481px]:text-[10px] font-semibold text-[#1D2229] underline decoration-[#E34C33] decoration-2 underline-offset-5 uppercase">
                      {article.category?.name ?? "News"}
                    </span>
                    <p
                      className="text-xs max-[481px]:text-[10px] font-medium"
                      style={{
                        color: "rgba(29, 34, 41, 0.6784)",
                      }}
                    >
                      - {getRelativeTimeShort(article.date_time_post)}
                    </p>
                  </div>
                  <h2 className="w-full text-lg max-[481px]:text-sm font-semibold text-gray-900 line-clamp-2 leading-relaxed break-words">
                    {article.title}
                  </h2>
                  {article.content_blocks && article.content_blocks.length > 0 && (
                    <p
                      className="hidden min-[639px]:block text-sm text-gray-600 line-clamp-2 overflow-hidden mt-1"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {stripHtmlToText(article.content_blocks[0].paragraph)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
