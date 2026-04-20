"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getNews } from "@/services/news";
import type { News } from "@/types/news";
import { Play } from "lucide-react";

export default function VideoDashboard() {
  const [videos, setVideos] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  // Ref to track if fetch has been called to prevent duplicate calls in React Strict Mode
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode (development)
    if (hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;

    const fetchVideos = async () => {
      try {
        setLoading(true);
        const response = await getNews();

        // Filter news with video URL (middle_video_url) not null
        const videosWithUrl = response.data.filter(
          (article) =>
            article.middle_video_url !== null &&
            article.middle_video_url !== undefined,
        );

        // Sort by date_time_post (newest first) and take 70
        const sortedVideos = videosWithUrl
          .sort(
            (a, b) =>
              new Date(b.date_time_post).getTime() -
              new Date(a.date_time_post).getTime(),
          )
          .slice(0, 70);

        setVideos(sortedVideos);
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

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

  // Get video thumbnail (cover image or YouTube thumbnail)
  const getVideoThumbnail = (video: News): string | null => {
    // First, try to use cover image
    if (video.cover) {
      return video.cover;
    }

    // If no cover, try to get YouTube thumbnail from video URL
    if (video.middle_video_url && isYouTubeUrl(video.middle_video_url)) {
      return getYouTubeThumbnail(video.middle_video_url);
    }

    return null;
  };

  if (loading) {
    return (
      <div className="w-full space-y-8">
        {/* Main Featured Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Large Video Card Skeleton */}
          <div className="lg:col-span-2 animate-pulse">
            <div className="w-full space-y-4">
              {/* Video Thumbnail Skeleton */}
              <div className="relative w-full aspect-video rounded-[20px] bg-gray-200"></div>

              {/* Video Info Skeleton */}
              <div className="space-y-3">
                <div className="flex gap-6 items-center">
                  <div className="h-5 bg-gray-200 rounded-[10px] w-24"></div>
                  <div className="h-4 bg-gray-200 rounded-[10px] w-32"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded-[10px] w-full"></div>
                <div className="h-8 bg-gray-200 rounded-[10px] w-5/6"></div>
                <div className="h-5 bg-gray-200 rounded-[10px] w-full"></div>
                <div className="h-5 bg-gray-200 rounded-[10px] w-4/5"></div>
                <div className="h-4 bg-gray-200 rounded-[10px] w-full"></div>
                <div className="h-4 bg-gray-200 rounded-[10px] w-5/6"></div>
              </div>
            </div>
          </div>

          {/* Right: Small Video Cards Grid Skeleton */}
          <div className="lg:col-span-1">
            <div className="grid grid-cols-2 gap-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="space-y-2 animate-pulse">
                  {/* Video Thumbnail Skeleton */}
                  <div className="relative w-full aspect-video rounded-[20px] bg-gray-200"></div>

                  {/* Video Info Skeleton */}
                  <div className="space-y-1">
                    <div className="flex flex-col gap-1.5">
                      <div className="h-3 bg-gray-200 rounded-[10px] w-16"></div>
                      <div className="h-3 bg-gray-200 rounded-[10px] w-20"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-[10px] w-full"></div>
                    <div className="h-4 bg-gray-200 rounded-[10px] w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Remaining Videos Grid Skeleton */}
        <div className="space-y-6">
          {/* "More Videos" Title Skeleton */}
          <div className="h-7 bg-gray-200 rounded-[10px] w-40 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="space-y-3 animate-pulse">
                {/* Video Thumbnail Skeleton */}
                <div className="relative w-full aspect-video rounded-[20px] bg-gray-200"></div>

                {/* Video Info Skeleton */}
                <div className="space-y-2">
                  <div className="flex flex-col gap-1.5">
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

  const mainVideo = videos[0];
  const featuredVideos = videos.slice(1, 7); // Next 6 videos for right side (3 rows x 2 columns)
  const remainingVideos = videos.slice(7); // Remaining videos for grid below

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      {/* <div className="border-b border-gray-200 pb-4">
                <h1 className="text-2xl font-bold text-[#1D2229]">News Videos</h1>
                <p className="text-sm text-gray-600 mt-1">
                    {videos.length} {videos.length === 1 ? "video" : "videos"} available
                </p>
            </div> */}

      {/* Main Featured Section: Large video on left, 4 small videos on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Large Video Card */}
        <div className="lg:col-span-2">
          {mainVideo && (
            <Link
              href={`/news/${mainVideo.id}`}
              className="block cursor-pointer hover:opacity-90 transition-opacity"
            >
              <div className="w-full space-y-4">
                {/* Video Thumbnail */}
                <div className="relative w-full aspect-video rounded-[20px] overflow-hidden bg-gray-200 group">
                  {getVideoThumbnail(mainVideo) ? (
                    <img
                      src={getVideoThumbnail(mainVideo)!}
                      alt={mainVideo.title}
                      className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        const currentSrc = img.src;
                        // If YouTube thumbnail fails, try hqdefault
                        if (currentSrc.includes("maxresdefault")) {
                          const videoId =
                            currentSrc.match(/vi\/([^\/]+)\//)?.[1];
                          if (videoId) {
                            img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                          } else {
                            img.style.display = "none";
                          }
                        } else {
                          img.style.display = "none";
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                      <Play className="w-16 h-16 text-gray-500" />
                    </div>
                  )}
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-opacity-30 group-hover:bg-opacity-40 transition-all">
                    <div className="w-20 h-20 rounded-full bg-[#ffffff]/50 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Play
                        className="w-10 h-10 text-white ml-1"
                        fill="currentColor"
                      />
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="space-y-3">
                  <div className="flex gap-6 items-center">
                    {mainVideo.category && (
                      <span
                        className="inline-block text-sm font-semibold text-[#1D2229] underline decoration-[#E34C33] decoration-2 underline-offset-5 uppercase"
                        style={{ fontFamily: "Hanuman" }}
                      >
                        {mainVideo.category.name}
                      </span>
                    )}
                    <p
                      className="text-xs text-gray-500 font-medium"
                      style={{ fontFamily: "Hanuman" }}
                    >
                      {formatDate(mainVideo.date_time_post)}
                    </p>
                  </div>
                  <h2
                    className="text-2xl lg:text-3xl font-bold text-[#1D2229] leading-tight"
                    style={{ fontFamily: "Hanuman" }}
                  >
                    {mainVideo.title}
                  </h2>
                  {mainVideo.subtitle && (
                    <p
                      className="text-base text-gray-700 line-clamp-3"
                      style={{ fontFamily: "Hanuman" }}
                    >
                      {mainVideo.subtitle}
                    </p>
                  )}
                  {mainVideo.content_blocks &&
                    mainVideo.content_blocks.length > 0 && (
                      <p
                        className="text-sm text-gray-600 line-clamp-2"
                        style={{ fontFamily: "Hanuman" }}
                      >
                        {mainVideo.content_blocks[0].paragraph}
                      </p>
                    )}
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Right: 4 Small Video Cards Grid */}
        <div className="lg:col-span-1">
          <div className="grid grid-cols-2 gap-4">
            {featuredVideos.map((video) => (
              <Link
                key={video.id}
                href={`/news/${video.id}`}
                className="block cursor-pointer hover:opacity-90 transition-opacity"
              >
                <div className="space-y-2">
                  {/* Video Thumbnail */}
                  <div className="relative w-full aspect-video rounded-[20px] overflow-hidden bg-gray-200 group">
                    {getVideoThumbnail(video) ? (
                      <img
                        src={getVideoThumbnail(video)!}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          const currentSrc = img.src;
                          // If YouTube thumbnail fails, try hqdefault
                          if (currentSrc.includes("maxresdefault")) {
                            const videoId =
                              currentSrc.match(/vi\/([^\/]+)\//)?.[1];
                            if (videoId) {
                              img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                            } else {
                              img.style.display = "none";
                            }
                          } else {
                            img.style.display = "none";
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                        <Play className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-opacity-30 group-hover:bg-opacity-40 transition-all">
                      <div className="w-12 h-12 rounded-full bg-[#ffffff]/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play
                          className="w-6 h-6 text-white ml-0.5"
                          fill="currentColor"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="space-y-1">
                    <div className="flex flex-col gap-1.5">
                      {video.category && (
                        <span
                          className="text-xs font-semibold text-[#1D2229] underline decoration-[#E34C33] decoration-2 underline-offset-5 uppercase"
                          style={{ fontFamily: "Hanuman" }}
                        >
                          {video.category.name}
                        </span>
                      )}
                      <p
                        className="text-xs text-gray-500"
                        style={{ fontFamily: "Hanuman" }}
                      >
                        {formatDate(video.date_time_post)}
                      </p>
                    </div>
                    <h3
                      className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight"
                      style={{ fontFamily: "Hanuman" }}
                    >
                      {video.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Remaining Videos Grid */}
      {remainingVideos.length > 0 && (
        <div className="space-y-6">
          <h2
            className="text-xl font-bold text-[#1D2229]"
            style={{ fontFamily: "Hanuman" }}
          >
            More Videos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {remainingVideos.map((video) => (
              <Link
                key={video.id}
                href={`/news/${video.id}`}
                className="block cursor-pointer hover:opacity-90 transition-opacity"
              >
                <div className="space-y-3">
                  {/* Video Thumbnail */}
                  <div className="relative w-full aspect-video rounded-[20px] overflow-hidden bg-gray-200 group">
                    {getVideoThumbnail(video) ? (
                      <img
                        src={getVideoThumbnail(video)!}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          const currentSrc = img.src;
                          // If YouTube thumbnail fails, try hqdefault
                          if (currentSrc.includes("maxresdefault")) {
                            const videoId =
                              currentSrc.match(/vi\/([^\/]+)\//)?.[1];
                            if (videoId) {
                              img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                            } else {
                              img.style.display = "none";
                            }
                          } else {
                            img.style.display = "none";
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                        <Play className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-opacity-30 group-hover:bg-opacity-40 transition-all">
                      <div className="w-16 h-16 rounded-full bg-[#ffffff]/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play
                          className="w-8 h-8 text-white ml-1"
                          fill="currentColor"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1.5">
                      {video.category && (
                        <span
                          className="text-xs font-semibold text-[#1D2229] underline decoration-[#E34C33] decoration-2 underline-offset-5 uppercase"
                          style={{ fontFamily: "Hanuman" }}
                        >
                          {video.category.name}
                        </span>
                      )}
                      <p
                        className="text-xs text-gray-500 font-medium"
                        style={{ fontFamily: "Hanuman" }}
                      >
                        {formatDate(video.date_time_post)}
                      </p>
                    </div>
                    <h3
                      className="text-base font-semibold text-gray-900 line-clamp-2 leading-tight"
                      style={{ fontFamily: "Hanuman" }}
                    >
                      {video.title}
                    </h3>
                    {video.subtitle && (
                      <p
                        className="text-sm text-gray-600 line-clamp-2"
                        style={{ fontFamily: "Hanuman" }}
                      >
                        {video.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
