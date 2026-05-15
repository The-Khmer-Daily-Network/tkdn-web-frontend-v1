"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { News } from "@/types/news";
import { getInternationalNews } from "@/services/news";
import { getNewsPath } from "@/utils/newsSlug";
import { stripHtmlToText } from "@/utils/text";

const DISPLAY_LIMIT = 15;

const EMPTY_NEWS: News[] = [];

interface InternationalFeatureProps {
  allNews?: News[];
  loading?: boolean;
  disableFetch?: boolean;
}

type InternationalResponse = { success: boolean; data: News[] };

export default function InternationalFeature({
  allNews,
  loading: externalLoading = false,
  disableFetch = false,
}: InternationalFeatureProps) {
  const resolvedAllNews = allNews ?? EMPTY_NEWS;
  const [news, setNews] = useState<News[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    if (resolvedAllNews.length > 0) {
      const internationalNews = resolvedAllNews.filter(
        (article) =>
          article.category?.name === "International" && article.cover !== null,
      );
      const sorted = internationalNews
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
    getInternationalNews()
      .then((res: InternationalResponse) => {
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
        if (!cancelled) console.error("Error fetching international news:", err);
      })
      .finally(() => {
        if (!cancelled) setInternalLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedAllNews, disableFetch]);

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

  const loading = externalLoading || internalLoading;

  if (loading) {
    return (
      <div className="w-full">
        <div className="h-7 bg-gray-200 rounded-[10px] w-56 mb-3 animate-pulse"></div>
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, index) => index + 1).map((item) => (
            <div key={item} className="flex flex-row gap-4 animate-pulse">
              <div className="relative max-[400px]:w-[150px] w-[200px] sm:w-[250px] h-[140px] shrink-0 rounded-[10px] bg-gray-200"></div>
              <div className="hidden sm:flex flex-1 flex-col justify-center space-y-3">
                <div className="flex flex-row space-x-5">
                  <div className="h-3 bg-gray-200 rounded-[10px] w-24"></div>
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
        <p className="text-gray-600">No international news available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2
        className="text-xl font-bold text-[#E34C33] mb-3"
       
    >
        International News
      </h2>
      <div className="space-y-4">
        {news.map((article) => (
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
                className="w-full text-lg max-[481px]:text-sm font-semibold text-gray-900 line-clamp-2 leading-relaxed break-words"
                
            >
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
    </div>
  );
}
