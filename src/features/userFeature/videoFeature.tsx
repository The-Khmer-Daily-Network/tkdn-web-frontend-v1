"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { News } from "@/types/news";
import { getVideosNews } from "@/services/news";
import { Play } from "lucide-react";
import { getNewsPath } from "@/utils/newsSlug";

const DISPLAY_LIMIT = 15;

const EMPTY_NEWS: News[] = [];

interface VideoFeatureProps {
  allNews?: News[];
  loading?: boolean;
  disableFetch?: boolean;
}

type VideosResponse = { success: boolean; data: News[] };

export default function VideoFeature({
  allNews,
  loading: externalLoading = false,
  disableFetch = false,
}: VideoFeatureProps) {
  const resolvedAllNews = allNews ?? EMPTY_NEWS;
  const [videos, setVideos] = useState<News[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    if (resolvedAllNews.length > 0) {
      const videosWithUrl = resolvedAllNews.filter(
        (article) =>
          article.middle_video_url !== null && article.cover !== null,
      );
      const sorted = videosWithUrl
        .sort(
          (a, b) =>
            new Date(b.date_time_post).getTime() -
            new Date(a.date_time_post).getTime(),
        )
        .slice(0, DISPLAY_LIMIT);
      setVideos(sorted);
      return;
    }

    if (disableFetch) return;

    let cancelled = false;
    setInternalLoading(true);
    getVideosNews()
      .then((res: VideosResponse) => {
        if (cancelled) return;
        const items = Array.isArray(res?.data) ? res.data : [];
        const withCover = items.filter(
          (a) => a.cover != null && a.middle_video_url != null,
        );
        const sorted = withCover
          .sort(
            (a, b) =>
              new Date(b.date_time_post).getTime() -
              new Date(a.date_time_post).getTime(),
          )
          .slice(0, DISPLAY_LIMIT);
        setVideos(sorted);
      })
      .catch((err) => {
        if (!cancelled) console.error("Error fetching videos:", err);
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
        <div className="h-7 bg-gray-200 rounded-[10px] w-40 mb-3 animate-pulse"></div>
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

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">No videos available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2
        className="text-xl font-bold text-[#E34C33] mb-3"
       
    >
        News Video
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <Link
            key={video.id}
            href={getNewsPath(video)}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              window.location.href = getNewsPath(video);
            }}
            className="bg-white rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow block"
        >
            <div className="relative w-full aspect-video bg-gray-200 group">
              {video.cover && (
                <Image
                  src={video.cover}
                  alt={video.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="w-full h-full object-cover"
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-opacity-30 group-hover:bg-opacity-40 transition-all">
                <div className="w-16 h-16 rounded-full bg-[#ffffff]/50 bg-opacity-90 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play
                    className="w-8 h-8 text-[#ffffff] ml-1"
                    fill="currentColor"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex flex-col space-y-2">
                {video.category && (
                  <span
                    className="text-xs font-semibold text-[#1D2229] underline decoration-[#E34C33] decoration-2 underline-offset-3 uppercase"
                   
                >
                    {video.category.name}
                  </span>
                )}
                <p
                  className="text-xs font-medium"
                  style={{
                    color: "rgba(29, 34, 41, 0.6784)",
                  }}
              >
                  {formatDate(video.date_time_post)}
                </p>
              </div>
              <h2
                className="text-base font-semibold text-gray-900 line-clamp-2 leading-tight"
               
            >
                {video.title}
              </h2>
              {video.content_blocks && video.content_blocks.length > 0 && (
                <p
                  className="text-sm text-gray-600 line-clamp-2"
                 
              >
                  {video.content_blocks[0].paragraph}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
