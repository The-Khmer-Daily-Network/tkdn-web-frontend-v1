"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Video,
  Check,
} from "lucide-react";
import { getContentVideos } from "@/services/contentVideo";
import type { ContentVideo } from "@/types/contentVideo";
import UploadVideoModal from "./UploadVideoModal";

const ITEMS_PER_PAGE = 15;

interface VideoSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (video: ContentVideo) => void; // Required: callback when a video is selected
}

export default function VideoSelectorModal({
  isOpen,
  onClose,
  onSelect,
}: VideoSelectorModalProps) {
  const [videos, setVideos] = useState<ContentVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null);
  const [videoErrors, setVideoErrors] = useState<{ [key: number]: boolean }>(
    {},
  );
  const [videoLoading, setVideoLoading] = useState<{ [key: number]: boolean }>(
    {},
  );
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

  useEffect(() => {
    if (isOpen) {
      fetchVideos();
    }
  }, [isOpen]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getContentVideos();
      // Ensure video URLs are properly formatted (fix escaped slashes)
      const cleanedVideos = response.data.map((video: ContentVideo) => ({
        ...video,
        video_url: video.video_url.replace(/\\\//g, "/"),
      }));
      setVideos(cleanedVideos);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch content videos",
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate pagination data with useMemo for performance
  const paginatedData = useMemo(() => {
    const totalPages = Math.ceil(videos.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedVideos = videos.slice(startIndex, endIndex);

    return {
      paginatedVideos,
      totalPages,
      totalItems: videos.length,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, videos.length),
    };
  }, [videos, currentPage]);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (
      paginatedData.totalPages > 0 &&
      currentPage > paginatedData.totalPages
    ) {
      setCurrentPage(1);
    }
  }, [paginatedData.totalPages, currentPage]);

  const handleUpload = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadSuccess = () => {
    // Refresh the videos list after successful upload
    fetchVideos();
  };

  const handleVideoClick = (video: ContentVideo) => {
    onSelect(video);
    onClose();
  };

  const handlePlayVideo = async (videoId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selection when clicking play button

    const video = videoRefs.current[videoId];
    if (!video) {
      console.error("Video element not found for video ID:", videoId);
      return;
    }

    try {
      // Pause all other videos
      Object.values(videoRefs.current).forEach((v) => {
        if (v && v !== video) {
          v.pause();
        }
      });

      if (playingVideoId === videoId && !video.paused) {
        // If this video is playing, pause it
        video.pause();
        setPlayingVideoId(null);
      } else {
        // Play this video
        await video.play();
        setPlayingVideoId(videoId);
      }
    } catch (error) {
      console.error("Error playing video:", error);
      // Don't set error state here as it's a modal, just log it
    }
  };

  const handleVideoEnded = (videoId: number) => {
    setPlayingVideoId(null);
  };

  const handleVideoPause = (videoId: number) => {
    if (playingVideoId === videoId) {
      setPlayingVideoId(null);
    }
  };

  const handleVideoLoadStart = (videoId: number) => {
    setVideoLoading((prev) => ({ ...prev, [videoId]: true }));
    setVideoErrors((prev) => ({ ...prev, [videoId]: false }));
  };

  const handleVideoLoadedData = (videoId: number) => {
    setVideoLoading((prev) => ({ ...prev, [videoId]: false }));
  };

  const handleVideoError = (
    videoId: number,
    event?: React.SyntheticEvent<HTMLVideoElement, Event>,
  ) => {
    setVideoLoading((prev) => ({ ...prev, [videoId]: false }));
    setVideoErrors((prev) => ({ ...prev, [videoId]: true }));

    const video = videoRefs.current[videoId];
    const videoUrl = videos.find((v) => v.id === videoId)?.video_url;

    console.error("Video failed to load:", {
      videoId,
      videoUrl,
      error: event?.currentTarget?.error,
      errorCode: event?.currentTarget?.error?.code,
      errorMessage: event?.currentTarget?.error?.message,
      networkState: video?.networkState,
      readyState: video?.readyState,
    });
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur effect */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[150]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Content Videos
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {paginatedData.totalItems > 0
                  ? `Showing ${paginatedData.startIndex}-${paginatedData.endIndex} of ${paginatedData.totalItems} videos`
                  : "No videos available"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleUpload}
                className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm text-xs"
            >
                <Plus size={14} />
                Upload Video
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Close"
            >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden p-3">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-600 text-sm">
                  Loading content videos...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-red-600 mb-4 text-sm">Error: {error}</p>
                <button
                  onClick={fetchVideos}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
              >
                  Retry
                </button>
              </div>
            ) : videos.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 mb-4 text-sm">
                    No content videos found.
                  </p>
                  <button
                    onClick={handleUpload}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                >
                    Upload Your First Video
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2.5 h-full">
                {paginatedData.paginatedVideos.map((video) => (
                  <div
                    key={video.id}
                    className="relative group rounded-md overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col"
                >
                    <div className="relative aspect-square bg-gray-100 shrink-0 overflow-hidden">
                      {/* Select Button - Top Right */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVideoClick(video);
                        }}
                        className="absolute top-1.5 right-1.5 z-20 bg-blue-600 text-white px-2 py-1 rounded-md text-[10px] font-medium hover:bg-blue-700 transition-colors shadow-md opacity-0 group-hover:opacity-100 flex items-center gap-1"
                        aria-label="Select video"
                    >
                        <Check size={12} />
                        Select
                      </button>

                      {videoErrors[video.id] ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200">
                          <Video className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-[10px] text-gray-500 px-2 text-center">
                            Video failed to load
                          </p>
                        </div>
                      ) : (
                        <>
                          <video
                            ref={(el) => {
                              videoRefs.current[video.id] = el;
                            }}
                            src={video.video_url}
                            className="w-full h-full object-cover cursor-pointer"
                            muted
                            playsInline
                            preload="metadata"
                            onClick={(e) => handlePlayVideo(video.id, e)}
                            onLoadStart={() => handleVideoLoadStart(video.id)}
                            onLoadedData={() => handleVideoLoadedData(video.id)}
                            onError={(e) => handleVideoError(video.id, e)}
                            onEnded={() => handleVideoEnded(video.id)}
                            onPause={() => handleVideoPause(video.id)}
                            onPlay={() => setPlayingVideoId(video.id)}
                          />
                          {videoLoading[video.id] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-5">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            </div>
                          )}
                          {playingVideoId !== video.id &&
                            !videoLoading[video.id] && (
                              <div
                                onClick={(e) => handlePlayVideo(video.id, e)}
                                className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors cursor-pointer z-10 pointer-events-auto"
                                aria-label="Play video"
                            >
                                <div className="bg-white/90 rounded-full p-2 hover:bg-white transition-colors pointer-events-none">
                                  <Play
                                    size={20}
                                    className="text-gray-900 ml-0.5"
                                    fill="currentColor"
                                  />
                                </div>
                              </div>
                            )}
                          {playingVideoId === video.id &&
                            !videoLoading[video.id] && (
                              <div
                                onClick={(e) => handlePlayVideo(video.id, e)}
                                className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors cursor-pointer z-10 pointer-events-auto"
                                aria-label="Pause video"
                            >
                                <div className="bg-white/90 rounded-full p-2 hover:bg-white transition-colors opacity-0 group-hover:opacity-100 pointer-events-none">
                                  <div className="w-5 h-5 flex items-center justify-center">
                                    <div className="w-1 h-3 bg-gray-900 mr-0.5"></div>
                                    <div className="w-1 h-3 bg-gray-900"></div>
                                  </div>
                                </div>
                              </div>
                            )}
                        </>
                      )}
                    </div>
                    <div className="p-1.5 shrink-0">
                      <p className="text-[10px] font-medium text-gray-900 truncate leading-tight">
                        {video.title}
                      </p>
                      <p className="text-[9px] text-gray-500 truncate mt-0.5 leading-tight">
                        {video.original_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {paginatedData.totalPages > 1 && (
            <div className="border-t border-gray-200 px-4 py-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                  <ChevronLeft size={14} />
                  Previous
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from(
                    { length: paginatedData.totalPages },
                    (_, i) => i + 1,
                  ).map((page) => {
                    const showPage =
                      page === 1 ||
                      page === paginatedData.totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);

                    if (!showPage) {
                      if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span
                            key={page}
                            className="px-1.5 text-gray-500 text-xs"
                        >
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`cursor-pointer px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === paginatedData.totalPages}
                  className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadVideoModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
}
