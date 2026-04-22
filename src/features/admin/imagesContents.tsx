"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { getContentImages, deleteContentImage } from "@/services/contentImage";
import type { ContentImage } from "@/types/contentImage";
import UploadImageModal from "@/components/admin/UploadImageModal";

const ITEMS_PER_PAGE = 15;

export default function ImagesContents() {
  const [images, setImages] = useState<ContentImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getContentImages();
      setImages(response.data);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching images:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch content images",
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate pagination data with useMemo for performance
  const paginatedData = useMemo(() => {
    const totalPages = Math.ceil(images.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedImages = images.slice(startIndex, endIndex);

    return {
      paginatedImages,
      totalPages,
      totalItems: images.length,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, images.length),
    };
  }, [images, currentPage]);

  // Reset to page 1 if current page is out of bounds
  useEffect(() => {
    if (
      paginatedData.totalPages > 0 &&
      currentPage > paginatedData.totalPages
    ) {
      setCurrentPage(1);
    }
  }, [paginatedData.totalPages, currentPage]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteContentImage(id);

      // Remove the deleted item from the state
      const updatedImages = images.filter((image) => image.id !== id);
      setImages(updatedImages);

      // Adjust page if needed (if we deleted the last item on the current page)
      const newTotalPages = Math.ceil(updatedImages.length / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete content image",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpload = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadSuccess = () => {
    // Refresh the images list after successful upload
    fetchImages();
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600">Loading content images...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={fetchImages}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
          Retry
        </button>
      </div>
    );
  }

  if (images.length === 0 && !loading) {
    return (
      <div className="relative h-screen flex flex-col">
        {/* Sticky Header with Upload Button */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Content Images
            </h2>
            <button
              type="button"
              onClick={handleUpload}
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm text-sm"
          >
              <Plus size={16} />
              Upload Image
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">No content images found.</p>
          </div>
        </div>

        {/* Upload Modal */}
        <UploadImageModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      </div>
    );
  }

  return (
    <div className="relative h-screen flex flex-col">
      {/* Sticky Header with Upload Button */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-2 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Content Images
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Showing {paginatedData.startIndex}-{paginatedData.endIndex} of{" "}
              {paginatedData.totalItems} images
            </p>
          </div>
          <button
            type="button"
            onClick={handleUpload}
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm text-xs"
        >
            <Plus size={14} />
            Upload Image
          </button>
        </div>
      </div>

      {/* Image Grid - No scroll, fits exactly on screen */}
      <div className="flex-1 p-3 overflow-hidden">
        <div className="grid grid-cols-5 gap-2.5 h-full">
          {paginatedData.paginatedImages.map((image) => (
            <div
              key={image.id}
              className="relative group rounded-md overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col"
          >
              <div className="relative aspect-square bg-gray-100 shrink-0">
                <Image
                  src={image.image_url}
                  alt={image.title}
                  fill
                  className="object-cover"
                  sizes="20vw"
                  loading="lazy"
                />
                <button
                  onClick={() => handleDelete(image.id)}
                  disabled={deletingId === image.id}
                  className="cursor-pointer absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  aria-label="Delete image"
              >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="p-1.5 shrink-0">
                <p className="text-[10px] font-medium text-gray-900 truncate leading-tight">
                  {image.title}
                </p>
                <p className="text-[9px] text-gray-500 truncate mt-0.5 leading-tight">
                  {image.original_name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Pagination */}
      {paginatedData.totalPages > 1 && (
        <div className="sticky bottom-0 z-50 bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-2 flex items-center justify-between">
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
                // Show first page, last page, current page, and pages around current
                const showPage =
                  page === 1 ||
                  page === paginatedData.totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1);

                if (!showPage) {
                  // Show ellipsis
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="px-1.5 text-gray-500 text-xs">
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

      {/* Upload Modal */}
      <UploadImageModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
