"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Plus, ChevronLeft, ChevronRight, X } from "lucide-react";
import { getContentCovers } from "@/services/contentCover";
import type { ContentCover } from "@/types/contentCover";
import UploadCoverModal from "./UploadCoverModal";

const ITEMS_PER_PAGE = 15;

interface CoverSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cover: ContentCover) => void; // Required: callback when a cover is selected
}

export default function CoverSelectorModal({
  isOpen,
  onClose,
  onSelect,
}: CoverSelectorModalProps) {
  const [covers, setCovers] = useState<ContentCover[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCovers();
    }
  }, [isOpen]);

  const fetchCovers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getContentCovers();
      setCovers(response.data);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching covers:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch content covers",
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate pagination data with useMemo for performance
  const paginatedData = useMemo(() => {
    const totalPages = Math.ceil(covers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedCovers = covers.slice(startIndex, endIndex);

    return {
      paginatedCovers,
      totalPages,
      totalItems: covers.length,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, covers.length),
    };
  }, [covers, currentPage]);

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
    // Refresh the covers list after successful upload
    fetchCovers();
  };

  const handleCoverClick = (cover: ContentCover) => {
    onSelect(cover);
    onClose();
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
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Content Covers
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {paginatedData.totalItems > 0
                  ? `Showing ${paginatedData.startIndex}-${paginatedData.endIndex} of ${paginatedData.totalItems} covers`
                  : "No covers available"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleUpload}
                className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm text-xs"
              >
                <Plus size={14} />
                Upload Cover
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
                  Loading content covers...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-red-600 mb-4 text-sm">Error: {error}</p>
                <button
                  onClick={fetchCovers}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
                >
                  Retry
                </button>
              </div>
            ) : covers.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 mb-4 text-sm">
                    No content covers found.
                  </p>
                  <button
                    onClick={handleUpload}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                  >
                    Upload Your First Cover
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2.5 h-full">
                {paginatedData.paginatedCovers.map((cover) => (
                  <div
                    key={cover.id}
                    className="relative group rounded-md overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white cursor-pointer flex flex-col"
                    onClick={() => handleCoverClick(cover)}
                  >
                    <div className="relative aspect-square bg-gray-100 shrink-0">
                      <Image
                        src={cover.image_url}
                        alt={cover.title}
                        fill
                        className="object-cover"
                        sizes="20vw"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-1.5 shrink-0">
                      <p className="text-[10px] font-medium text-gray-900 truncate leading-tight">
                        {cover.title}
                      </p>
                      <p className="text-[9px] text-gray-500 truncate mt-0.5 leading-tight">
                        {cover.original_name}
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
      <UploadCoverModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
}
