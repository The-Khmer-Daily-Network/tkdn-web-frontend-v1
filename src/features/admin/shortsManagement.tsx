"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Youtube,
  Upload,
  ImagePlus,
  Eye,
  Heart,
} from "lucide-react";
import {
  createVideoShort,
  deleteVideoShort,
  getVideoShorts,
  updateVideoShort,
  youtubeIdFromUrl,
} from "@/services/videosShort";
import type { VideoShort, VideoShortSourceType } from "@/types/videosShort";

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const MAX_DURATION_SECONDS = 180;

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(video.duration || 0));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video duration."));
    };
    video.src = url;
  });
}

function FilePicker({
  label,
  hint,
  accept,
  file,
  disabled,
  icon,
  onChange,
}: {
  label: string;
  hint?: string;
  accept: string;
  file: File | null;
  disabled?: boolean;
  icon?: React.ReactNode;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer w-full flex items-center justify-between gap-3 rounded-xl border border-dashed border-gray-300 bg-[#fafafa] px-4 py-3 text-left hover:border-gray-400 hover:bg-white transition-colors disabled:opacity-50"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-500">
            {icon ?? <ImagePlus size={16} />}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-gray-900 truncate">
              {file ? file.name : label}
            </span>
            {hint && !file && (
              <span className="block text-xs text-gray-500 mt-0.5">{hint}</span>
            )}
          </span>
        </span>
        <span className="shrink-0 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1 bg-white">
          Choose
        </span>
      </button>
    </div>
  );
}

interface ShortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  short?: VideoShort | null;
}

function ShortModal({ isOpen, onClose, onSuccess, short }: ShortModalProps) {
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<VideoShortSourceType>("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (short) {
      setTitle(short.title);
      setSourceType(short.source_type);
      setYoutubeUrl(short.youtube_url ?? "");
      setIsActive(short.is_active);
    } else {
      setTitle("");
      setSourceType("youtube");
      setYoutubeUrl("");
      setIsActive(true);
    }
    setVideoFile(null);
    setCoverFile(null);
    setError(null);
  }, [short, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (sourceType === "youtube") {
        if (!youtubeUrl.trim()) {
          setError("YouTube URL is required");
          return;
        }
        if (!youtubeIdFromUrl(youtubeUrl.trim())) {
          setError("Enter a valid YouTube watch, Shorts, or youtu.be URL");
          return;
        }
      } else if (!short?.video_url && !videoFile) {
        setError("A video file is required for uploaded shorts");
        return;
      }

      if (videoFile) {
        if (videoFile.size > MAX_UPLOAD_BYTES) {
          setError("Video must be 100MB or less before compress");
          return;
        }
        const duration = await readVideoDuration(videoFile);
        if (duration > MAX_DURATION_SECONDS) {
          setError("Short video must be 3 minutes or less");
          return;
        }
      }

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("source_type", sourceType);
      formData.append("is_active", isActive ? "1" : "0");

      if (sourceType === "youtube") {
        formData.append("youtube_url", youtubeUrl.trim());
      }
      if (videoFile) {
        formData.append("video", videoFile);
      }
      if (coverFile) {
        formData.append("cover_file", coverFile);
      }

      if (short) {
        await updateVideoShort(short.id, formData);
      } else {
        await createVideoShort(formData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save short");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
              {short ? "Edit short" : "Create short"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-5 max-h-[calc(90vh-160px)] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter short title"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Source
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setSourceType("youtube")}
                    className={`cursor-pointer flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                      sourceType === "youtube"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <Youtube size={16} />
                    YouTube
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setSourceType("upload")}
                    className={`cursor-pointer flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                      sourceType === "upload"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <Upload size={16} />
                    Upload
                  </button>
                </div>
              </div>

              {sourceType === "youtube" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/shorts/..."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    disabled={loading}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Video file
                  </label>
                  <FilePicker
                    label={short?.video_url ? "Replace current video" : "Select a video"}
                    hint="MP4, MOV, AVI, or WEBM · max 3 minutes"
                    accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
                    file={videoFile}
                    disabled={loading}
                    icon={<Upload size={16} />}
                    onChange={setVideoFile}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cover image
                  <span className="font-normal text-gray-400"> · optional</span>
                </label>
                <FilePicker
                  label="Add a cover"
                  hint={
                    sourceType === "youtube"
                      ? "Leave empty to use the YouTube thumbnail"
                      : "JPG, PNG, or WEBP"
                  }
                  accept="image/jpeg,image/png,image/webp"
                  file={coverFile}
                  disabled={loading}
                  onChange={setCoverFile}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Active</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Show this short on the public page
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  disabled={loading}
                  onClick={() => setIsActive((value) => !value)}
                  className={`cursor-pointer relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                    isActive ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-3.5 py-2.5">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white border border-gray-200 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="cursor-pointer px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : short ? "Save changes" : "Create short"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function ShortsManagement() {
  const [shorts, setShorts] = useState<VideoShort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShort, setSelectedShort] = useState<VideoShort | null>(null);

  useEffect(() => {
    fetchShorts();
  }, []);

  const fetchShorts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getVideoShorts(true);
      setShorts(response.data);
    } catch (err) {
      console.error("Error fetching shorts:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch shorts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedShort(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: VideoShort) => {
    setSelectedShort(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this short?")) {
      return;
    }
    try {
      setDeletingId(id);
      await deleteVideoShort(id);
      await fetchShorts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete short");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading shorts...</p>
      </div>
    );
  }

  if (error && shorts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchShorts}
          className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen flex flex-col bg-[#f7f7f7]">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
            Shorts Management
          </h2>
          <button
            onClick={handleCreate}
            className="cursor-pointer flex items-center gap-2 px-3.5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Plus size={16} />
            Add short
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">{error}</p>
          </div>
        )}

        {shorts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-4">No shorts yet.</p>
              <button
                onClick={handleCreate}
                className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium"
              >
                Create your first short
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {shorts.map((item) => {
              const duration = formatDuration(item.duration_seconds);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-200/80 px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-[72px] w-[52px] shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {item.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.cover}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {item.title}
                        </p>
                        {!item.is_active && (
                          <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-gray-500 bg-gray-100 rounded-md px-1.5 py-0.5">
                            Hidden
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span>
                          {item.source_type === "youtube" ? "YouTube" : "Upload"}
                        </span>
                        {duration && <span>{duration}</span>}
                        <span className="inline-flex items-center gap-1">
                          <Eye size={12} />
                          {item.views_count}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Heart size={12} />
                          {item.likes_count}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(item)}
                        className="cursor-pointer p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="cursor-pointer p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ShortModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedShort(null);
        }}
        onSuccess={fetchShorts}
        short={selectedShort}
      />
    </div>
  );
}
