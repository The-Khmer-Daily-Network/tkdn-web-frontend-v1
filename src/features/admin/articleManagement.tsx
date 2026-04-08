"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { getNews, createNews, updateNews, deleteNews } from "@/services/news";
import { getCategories } from "@/services/category";
import { getPublishers } from "@/services/publisher";
import type { News, ContentBlock, EndImage } from "@/types/news";
import type { Category } from "@/types/category";
import type { Publisher } from "@/types/publisher";
import CoverSelectorModal from "@/components/admin/CoverSelectorModal";
import ImageSelectorModal from "@/components/admin/ImageSelectorModal";
import VideoSelectorModal from "@/components/admin/VideoSelectorModal";
import type { ContentCover } from "@/types/contentCover";
import type { ContentImage } from "@/types/contentImage";
import type { ContentVideo } from "@/types/contentVideo";

const ITEMS_PER_PAGE = 15;

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  news?: News | null;
  categories: Category[];
  publishers: Publisher[];
}

function NewsModal({
  isOpen,
  onClose,
  onSuccess,
  news,
  categories,
  publishers,
}: NewsModalProps) {
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [coverName, setCoverName] = useState<string | null>(null);
  const [coverUrlInput, setCoverUrlInput] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { subtitle: null, paragraph: "" },
  ]);
  const [middleImageUrl, setMiddleImageUrl] = useState<string | null>(null);
  const [middleImageName, setMiddleImageName] = useState<string | null>(null);
  const [middleImageUrlInput, setMiddleImageUrlInput] = useState("");
  const [middleVideoUrl, setMiddleVideoUrl] = useState<string | null>(null);
  const [middleVideoName, setMiddleVideoName] = useState<string | null>(null);
  const [endImages, setEndImages] = useState<EndImage[]>([]);
  const [endImageUrlInputs, setEndImageUrlInputs] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isMiddleImageModalOpen, setIsMiddleImageModalOpen] = useState(false);
  const [isMiddleVideoModalOpen, setIsMiddleVideoModalOpen] = useState(false);
  const [isEndImageModalOpen, setIsEndImageModalOpen] = useState(false);

  useEffect(() => {
    if (news) {
      setCategoryId(news.category_id);
      setAuthor(news.author);
      setTitle(news.title);
      setCover(news.cover);
      setCoverName(news.cover_name);
      setSubtitle(news.subtitle || "");
      setContentBlocks(
        news.content_blocks && news.content_blocks.length > 0
          ? news.content_blocks
          : [{ subtitle: null, paragraph: "" }],
      );
      setMiddleImageUrl(news.middle_image_url);
      setMiddleImageName(news.middle_image_name);
      setMiddleVideoUrl(news.middle_video_url);
      setMiddleVideoName(news.middle_video_name);
      setEndImages(
        news.end_images && news.end_images.length > 0 ? news.end_images : [],
      );
    } else {
      setCategoryId(null);
      setAuthor("");
      setTitle("");
      setCover(null);
      setCoverName(null);
      setCoverUrlInput("");
      setSubtitle("");
      setContentBlocks([{ subtitle: null, paragraph: "" }]);
      setMiddleImageUrl(null);
      setMiddleImageName(null);
      setMiddleImageUrlInput("");
      setMiddleVideoUrl(null);
      setMiddleVideoName(null);
      setEndImages([]);
      setEndImageUrlInputs([""]);
    }
    setError(null);
  }, [news, isOpen]);

  const handleAddContentBlock = () => {
    setContentBlocks([...contentBlocks, { subtitle: null, paragraph: "" }]);
  };

  const handleRemoveContentBlock = (index: number) => {
    if (contentBlocks.length > 1) {
      setContentBlocks(contentBlocks.filter((_, i) => i !== index));
    }
  };

  const handleUpdateContentBlock = (
    index: number,
    field: "subtitle" | "paragraph",
    value: string | null,
  ) => {
    const updated = [...contentBlocks];
    updated[index] = { ...updated[index], [field]: value };
    setContentBlocks(updated);
  };

  const handleSelectCover = (cover: ContentCover) => {
    setCover(cover.image_url);
    setCoverName(null); // Don't auto-fill name, let user input it
    setCoverUrlInput(""); // Clear URL input when selecting from library
  };

  const handleSelectMiddleImage = (image: ContentImage) => {
    setMiddleImageUrl(image.image_url);
    setMiddleImageName(null); // Don't auto-fill name, let user input it
    setMiddleImageUrlInput(""); // Clear URL input when selecting from library
    // Clear video when image is selected
    setMiddleVideoUrl(null);
    setMiddleVideoName(null);
  };

  const handleSelectMiddleVideo = (video: ContentVideo) => {
    setMiddleVideoUrl(video.video_url);
    setMiddleVideoName(null); // Don't auto-fill name, let user input it
    // Clear image when video is selected
    setMiddleImageUrl(null);
    setMiddleImageName(null);
  };

  const handleSelectEndImage = (image: ContentImage) => {
    if (endImages.length < 3) {
      setEndImages([...endImages, { url: image.image_url, name: null }]); // Don't auto-fill name, let user input it
      // Clear URL inputs when selecting from library
      setEndImageUrlInputs([""]);
    }
  };

  const handleRemoveEndImage = (index: number) => {
    setEndImages(endImages.filter((_, i) => i !== index));
  };

  const handleCoverUrlChange = (url: string) => {
    setCoverUrlInput(url);
    if (url.trim()) {
      setCover(url.trim());
    }
  };

  const handleMiddleImageUrlChange = (url: string) => {
    setMiddleImageUrlInput(url);
    if (url.trim()) {
      setMiddleImageUrl(url.trim());
      setMiddleVideoUrl(null);
      setMiddleVideoName(null);
    }
  };

  const handleAddEndImageUrl = () => {
    if (endImageUrlInputs.length < 3) {
      setEndImageUrlInputs([...endImageUrlInputs, ""]);
    }
  };

  const handleEndImageUrlChange = (index: number, url: string) => {
    const updated = [...endImageUrlInputs];
    updated[index] = url;
    setEndImageUrlInputs(updated);

    // Update endImages array based on URL inputs
    const validUrls = updated
      .filter((u) => u.trim() !== "")
      .map((u) => u.trim());
    setEndImages(validUrls.map((url) => ({ url, name: null })));
  };

  const handleRemoveEndImageUrl = (index: number) => {
    const updated = endImageUrlInputs.filter((_, i) => i !== index);
    setEndImageUrlInputs(updated);

    // Update endImages array based on remaining URL inputs
    const validUrls = updated
      .filter((u) => u.trim() !== "")
      .map((u) => u.trim());
    setEndImages(validUrls.map((url) => ({ url, name: null })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !author.trim()) {
      setError("Title and author are required");
      return;
    }

    // Validate content blocks
    const validBlocks = contentBlocks.filter((block) => block.paragraph.trim());
    if (validBlocks.length === 0) {
      setError("At least one content block with paragraph is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params: any = {
        category_id: categoryId || null,
        author: author.trim(),
        title: title.trim(),
        cover: cover,
        cover_name: coverName,
        subtitle: null,
        // date_time_post will be auto-set by backend
        content_blocks: validBlocks,
        end_images: endImages.length > 0 ? endImages : undefined,
      };

      // For articles: only send middle_image_url, don't send middle_video_url at all
      // Backend will automatically clear middle_video_url when middle_image_url is present
      if (middleImageUrl) {
        params.middle_image_url = middleImageUrl;
        params.middle_image_name = middleImageName;
      } else {
        // If no image, set to null to clear it
        params.middle_image_url = null;
        params.middle_image_name = null;
      }
      // Do NOT include middle_video_url or middle_video_name in the request

      if (news) {
        await updateNews(news.id, params);
      } else {
        await createNews(params);
      }

      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save article";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Flatten categories for dropdown (main categories and subcategories)
  const allCategories: Array<{ id: number; name: string; isSub: boolean }> = [];
  categories.forEach((cat) => {
    allCategories.push({ id: cat.id, name: cat.name, isSub: false });
    cat.subcategories.forEach((sub) => {
      allCategories.push({ id: sub.id, name: `  └ ${sub.name}`, isSub: true });
    });
  });

  // Create author options from publishers (similar to category dropdown)
  const authorOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = publishers.map(
      (pub) => {
        const fullName = `${pub.first_name} ${pub.last_name}`;
        return {
          value: fullName,
          label: `${fullName} (${pub.nickname})`,
        };
      },
    );

    // Add current author if it doesn't exist in publishers (for custom authors when editing)
    if (author && !options.find((opt) => opt.value === author)) {
      options.push({
        value: author,
        label: author,
      });
    }

    return options;
  }, [publishers, author]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
            <h2 className="text-xl font-semibold text-gray-900">
              {news ? "Edit" : "Create"} Article
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-gray-200">
                <div className="w-1 h-6 bg-blue-600 rounded"></div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Basic Information
                </h3>
              </div>

              {/* Title - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Article Title <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    ({title.length}/160 characters)
                  </span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a compelling article title..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                  disabled={loading}
                  required
                  maxLength={160}
                />
              </div>

              {/* Category and Author - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Category
                  </label>
                  <select
                    value={categoryId || ""}
                    onChange={(e) =>
                      setCategoryId(
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                    disabled={loading}
                  >
                    <option value="">Select category</option>
                    {allCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Author <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={author || ""}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-900"
                    disabled={loading}
                    required
                  >
                    <option value="">Select author</option>
                    {authorOptions.map((option, index) => (
                      <option key={index} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Images & Media Section - Three rows: Cover, Middle, End (3 columns) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-gray-200">
                <div className="w-1 h-6 bg-blue-600 rounded"></div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Images & Media
                </h3>
              </div>

              {/* Row 1: Cover Image */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Cover Image
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left column: select from library OR enter URL */}
                  <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Cover source
                      </span>
                      {cover && (
                        <button
                          type="button"
                          onClick={() => {
                            setCover(null);
                            setCoverName(null);
                            setCoverUrlInput("");
                          }}
                          className="cursor-pointer px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          disabled={loading}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {cover ? (
                      <div className="relative w-full aspect-100/53 rounded-lg overflow-hidden border border-gray-300 bg-white">
                        <img
                          src={cover}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-100/53 rounded-lg border-2 border-dashed border-gray-300 bg-white flex items-center justify-center">
                        <div className="flex flex-col items-center text-center px-4">
                          <ImageIcon className="w-6 h-6 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            No cover selected
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsCoverModalOpen(true)}
                      className="w-full cursor-pointer px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      disabled={loading}
                    >
                      Select from library
                    </button>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <span className="text-xs text-gray-500">OR</span>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>

                    <input
                      type="url"
                      value={coverUrlInput}
                      onChange={(e) => handleCoverUrlChange(e.target.value)}
                      placeholder="Enter image URL"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                      disabled={loading}
                    />
                  </div>

                  {/* Right column: image name only */}
                  <div className="space-y-2 p-4 bg-white rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700">
                      Image Name{" "}
                      <span className="text-xs font-normal text-gray-500">
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={coverName || ""}
                      onChange={(e) => setCoverName(e.target.value || null)}
                      placeholder="Enter image name..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500">
                      Used as a display name for the cover image.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 2: Middle Image */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Middle Image
                </label>
                {middleImageUrl ? (
                  <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="relative shrink-0">
                      <img
                        src={middleImageUrl}
                        alt="Middle"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-300 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setMiddleImageUrl(null);
                          setMiddleImageName(null);
                          setMiddleImageUrlInput("");
                        }}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        disabled={loading}
                      >
                        <X size={10} />
                      </button>
                    </div>
                    <div className="flex-1 min-w-[200px] flex items-center gap-3 flex-wrap">
                      <input
                        type="text"
                        value={middleImageName || ""}
                        onChange={(e) =>
                          setMiddleImageName(e.target.value || null)
                        }
                        placeholder="Image name (optional)"
                        className="flex-1 min-w-[140px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                        disabled={loading || !!middleVideoUrl}
                      />
                      <button
                        type="button"
                        onClick={() => setIsMiddleImageModalOpen(true)}
                        className="cursor-pointer px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading || !!middleVideoUrl}
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setIsMiddleImageModalOpen(true)}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 px-4 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading || !!middleVideoUrl}
                    >
                      <ImageIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 shrink-0" />
                      <span className="text-sm font-medium text-gray-700">
                        Select from library
                      </span>
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <span className="text-xs text-gray-500">OR</span>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="url"
                        value={middleImageUrlInput}
                        onChange={(e) =>
                          handleMiddleImageUrlChange(e.target.value)
                        }
                        placeholder="Enter image URL"
                        className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading || !!middleVideoUrl}
                      />
                      <input
                        type="text"
                        value={middleImageName || ""}
                        onChange={(e) =>
                          setMiddleImageName(e.target.value || null)
                        }
                        placeholder="Image name (optional)"
                        className="flex-1 min-w-[140px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading || !!middleVideoUrl}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Row 3: End Images (max 3 columns in one row) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    End Images{" "}
                    <span className="text-gray-500 font-normal">(Max 3)</span>
                  </label>
                  {endImages.length < 3 && (
                    <button
                      type="button"
                      onClick={() => setIsEndImageModalOpen(true)}
                      className="cursor-pointer px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 font-medium"
                      disabled={loading}
                    >
                      <Plus size={12} />
                      Add from library
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Column 1 */}
                  <div className="min-w-0">
                    {endImages[0] ? (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                        <div className="relative group aspect-square rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
                          <img
                            src={endImages[0].url}
                            alt={endImages[0].name || "End 1"}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleRemoveEndImage(0);
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 shadow-md"
                            disabled={loading}
                          >
                            <X size={10} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={endImages[0].name || ""}
                          onChange={(e) => {
                            const updated = [...endImages];
                            updated[0] = {
                              ...updated[0],
                              name: e.target.value || null,
                            };
                            setEndImages(updated);
                          }}
                          placeholder="Name (optional)"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                          disabled={loading}
                        />
                      </div>
                    ) : (
                      <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50 space-y-2">
                        <input
                          type="url"
                          value={endImageUrlInputs[0] || ""}
                          onChange={(e) =>
                            handleEndImageUrlChange(0, e.target.value)
                          }
                          placeholder="Enter image URL"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                          disabled={loading}
                        />
                        {endImageUrlInputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEndImageUrl(0)}
                            className="text-xs text-red-600 hover:underline"
                            disabled={loading}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Column 2 */}
                  <div className="min-w-0">
                    {endImages[1] ? (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                        <div className="relative group aspect-square rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
                          <img
                            src={endImages[1].url}
                            alt={endImages[1].name || "End 2"}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleRemoveEndImage(1);
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 shadow-md"
                            disabled={loading}
                          >
                            <X size={10} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={endImages[1].name || ""}
                          onChange={(e) => {
                            const updated = [...endImages];
                            updated[1] = {
                              ...updated[1],
                              name: e.target.value || null,
                            };
                            setEndImages(updated);
                          }}
                          placeholder="Name (optional)"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                          disabled={loading}
                        />
                      </div>
                    ) : (
                      <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50 space-y-2">
                        <input
                          type="url"
                          value={endImageUrlInputs[1] ?? ""}
                          onChange={(e) =>
                            handleEndImageUrlChange(1, e.target.value)
                          }
                          placeholder="Enter image URL"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                          disabled={loading}
                        />
                        {endImageUrlInputs.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEndImageUrl(1)}
                            className="text-xs text-red-600 hover:underline"
                            disabled={loading}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Column 3 */}
                  <div className="min-w-0">
                    {endImages[2] ? (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                        <div className="relative group aspect-square rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
                          <img
                            src={endImages[2].url}
                            alt={endImages[2].name || "End 3"}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleRemoveEndImage(2);
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 shadow-md"
                            disabled={loading}
                          >
                            <X size={10} />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={endImages[2].name || ""}
                          onChange={(e) => {
                            const updated = [...endImages];
                            updated[2] = {
                              ...updated[2],
                              name: e.target.value || null,
                            };
                            setEndImages(updated);
                          }}
                          placeholder="Name (optional)"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                          disabled={loading}
                        />
                      </div>
                    ) : (
                      <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50 space-y-2">
                        <input
                          type="url"
                          value={endImageUrlInputs[2] ?? ""}
                          onChange={(e) =>
                            handleEndImageUrlChange(2, e.target.value)
                          }
                          placeholder="Enter image URL"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                          disabled={loading}
                        />
                        {endImageUrlInputs.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEndImageUrl(2)}
                            className="text-xs text-red-600 hover:underline"
                            disabled={loading}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {endImages.length < 3 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-xs text-gray-500">
                      OR add via URL in a column above
                    </span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                )}
                {endImageUrlInputs.length < 3 && endImages.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddEndImageUrl}
                    className="w-full px-3 py-2 text-xs border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/30 transition-colors text-gray-600"
                    disabled={loading}
                  >
                    + Add another URL slot
                  </button>
                )}
              </div>
            </div>

            {/* Content Blocks Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b-2 border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-600 rounded"></div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Content Blocks <span className="text-red-500">*</span>
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddContentBlock}
                  className="cursor-pointer px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5 font-medium"
                  disabled={loading}
                >
                  <Plus size={14} />
                  Add Block
                </button>
              </div>
              <div className="space-y-3">
                {contentBlocks.map((block, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-300 rounded-lg bg-white hover:border-blue-400 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          Block {index + 1}
                        </span>
                      </div>
                      {contentBlocks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveContentBlock(index)}
                          className="cursor-pointer px-2 py-1 text-xs text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors font-medium"
                          disabled={loading}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Subtitle{" "}
                          <span className="text-gray-400 font-normal">
                            (Optional)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={block.subtitle || ""}
                          onChange={(e) =>
                            handleUpdateContentBlock(
                              index,
                              "subtitle",
                              e.target.value || null,
                            )
                          }
                          placeholder="Enter a subtitle for this block (optional)..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm text-gray-900 placeholder:text-gray-400 bg-white"
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Content <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={block.paragraph}
                          onChange={(e) =>
                            handleUpdateContentBlock(
                              index,
                              "paragraph",
                              e.target.value,
                            )
                          }
                          placeholder="Enter the main content for this block..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-sm text-gray-900 placeholder:text-gray-400 bg-white"
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="cursor-pointer px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim() || !author.trim()}
                className="cursor-pointer px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
              >
                {loading
                  ? "Saving..."
                  : news
                    ? "Update Article"
                    : "Create Article"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modals */}
      <CoverSelectorModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        onSelect={handleSelectCover}
      />

      <ImageSelectorModal
        isOpen={isMiddleImageModalOpen}
        onClose={() => setIsMiddleImageModalOpen(false)}
        onSelect={handleSelectMiddleImage}
      />

      <ImageSelectorModal
        isOpen={isEndImageModalOpen}
        onClose={() => setIsEndImageModalOpen(false)}
        onSelect={handleSelectEndImage}
      />
    </>
  );
}

export default function ArticleManagement() {
  const [articles, setArticles] = useState<News[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<News | null>(null);

  // Ref to track if fetch has been called to prevent duplicate calls in React Strict Mode
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode (development)
    if (hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [newsResponse, categoriesResponse, publishersResponse] =
        await Promise.all([getNews(), getCategories(), getPublishers()]);

      // Filter articles: middle_video_url is null (to distinguish from video articles)
      const filteredArticles = newsResponse.data.filter(
        (article) => !article.middle_video_url,
      );

      // Sort articles by date (latest first) - so numbering goes from highest to lowest
      const sortedArticles = filteredArticles.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; // Descending order (latest first)
      });

      setArticles(sortedArticles);
      setCategories(categoriesResponse.categories);
      setPublishers(publishersResponse.data);
      setCurrentPage(1); // Reset to first page when data is fetched
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate pagination data with useMemo for performance
  const paginatedData = useMemo(() => {
    const totalPages = Math.ceil(articles.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedArticles = articles.slice(startIndex, endIndex);

    return {
      paginatedArticles,
      totalPages,
      totalItems: articles.length,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, articles.length),
    };
  }, [articles, currentPage]);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (
      paginatedData.totalPages > 0 &&
      currentPage > paginatedData.totalPages
    ) {
      setCurrentPage(1);
    }
  }, [paginatedData.totalPages, currentPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= paginatedData.totalPages) {
      setCurrentPage(page);
      // Scroll to top of content area
      const contentArea = document.querySelector(".flex-1.overflow-y-auto");
      if (contentArea) {
        contentArea.scrollTop = 0;
      }
    }
  };

  const handleCreateArticle = () => {
    setSelectedArticle(null);
    setIsCreateModalOpen(true);
  };

  const handleEditArticle = (article: News) => {
    setSelectedArticle(article);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this article?")) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteNews(id);

      // Remove the deleted item from the state
      const updatedArticles = articles.filter((article) => article.id !== id);
      setArticles(updatedArticles);

      // Adjust page if needed (if we deleted the last item on the current page)
      const newTotalPages = Math.ceil(updatedArticles.length / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete article";
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading articles...</p>
      </div>
    );
  }

  if (error && articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Article Management
          </h2>
          <button
            onClick={handleCreateArticle}
            className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm text-sm"
          >
            <Plus size={16} />
            Add Article
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}

        {articles.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-4">No articles found.</p>
              <button
                onClick={handleCreateArticle}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Your First Article
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
              <div className="grid grid-cols-[1fr_2fr_2fr_1.5fr_1.5fr_2fr_2fr] gap-4 items-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <div className="text-center">#</div>
                <div>Cover Image</div>
                <div>Title</div>
                <div>Category</div>
                <div>Author</div>
                <div>Upload Date</div>
                <div className="text-center">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {paginatedData.paginatedArticles.map((article, index) => (
                <div
                  key={article.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-[1fr_2fr_2fr_1.5fr_1.5fr_2fr_2fr] gap-4 items-center">
                    {/* Number */}
                    <div className="text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {paginatedData.totalItems -
                          paginatedData.startIndex -
                          index +
                          1}
                      </span>
                    </div>

                    {/* Cover Image */}
                    <div>
                      {article.cover ? (
                        <div className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-200 bg-gray-100">
                          <img
                            src={article.cover}
                            alt="Cover"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center">
                          <span className="text-xs text-gray-400">
                            No Cover
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                        {article.title}
                      </h3>
                      {article.subtitle && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {article.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Category */}
                    <div>
                      {article.category ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {article.category.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">
                          No category
                        </span>
                      )}
                    </div>

                    {/* Author */}
                    <div>
                      <p className="text-sm text-gray-900">{article.author}</p>
                    </div>

                    {/* Upload Date */}
                    <div>
                      <p className="text-xs text-gray-600">
                        {formatDate(article.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditArticle(article)}
                          className="cursor-pointer p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          disabled={deletingId === article.id}
                          className="cursor-pointer p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination - Table Style */}
        {articles.length > 0 && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left side: Rows per page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Rows per page:</span>
                <select
                  value={ITEMS_PER_PAGE}
                  disabled
                  className="px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700 cursor-not-allowed"
                >
                  <option value={15}>15</option>
                </select>
              </div>

              {/* Center: Page info */}
              <div className="text-sm text-gray-700">
                {paginatedData.startIndex}-{paginatedData.endIndex} of{" "}
                {paginatedData.totalItems}
              </div>

              {/* Right side: Navigation buttons */}
              <div className="flex items-center gap-1">
                {/* First Page Button */}
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="cursor-pointer flex items-center justify-center w-8 h-8 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="First page"
                >
                  <ChevronsLeft size={16} />
                </button>

                {/* Previous Button */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="cursor-pointer flex items-center justify-center w-8 h-8 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Next Button */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === paginatedData.totalPages}
                  className="cursor-pointer flex items-center justify-center w-8 h-8 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight size={16} />
                </button>

                {/* Last Page Button */}
                <button
                  onClick={() => goToPage(paginatedData.totalPages)}
                  disabled={currentPage === paginatedData.totalPages}
                  className="cursor-pointer flex items-center justify-center w-8 h-8 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Last page"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewsModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchData}
        categories={categories}
        publishers={publishers}
      />

      <NewsModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedArticle(null);
        }}
        onSuccess={fetchData}
        news={selectedArticle}
        categories={categories}
        publishers={publishers}
      />
    </div>
  );
}
