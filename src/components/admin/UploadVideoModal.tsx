"use client";

import { useState, useRef } from "react";
import { X, Upload, Video, Loader2 } from "lucide-react";
import { uploadContentVideo } from "@/services/contentVideo";
import type { ContentVideo } from "@/types/contentVideo";

interface UploadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (video: ContentVideo) => void; // Callback when upload succeeds
}

export default function UploadVideoModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: UploadVideoModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const errors: string[] = [];

    // Validate file type (common video formats)
    const allowedTypes = [
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/x-msvideo",
      "video/webm",
    ];
    if (!allowedTypes.includes(file.type)) {
      errors.push("The video must be in MP4, MPEG, MOV, AVI, or WebM format.");
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      errors.push("The video must be less than 2MB.");
    }

    // If there are errors, show them all
    if (errors.length > 0) {
      setError(errors.join("\n"));
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    setSelectedFile(file);

    // Create preview using FileReader (data URL)
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a video file");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const response = await uploadContentVideo({
        video: selectedFile,
        title: undefined, // Auto-generate title on backend
      });

      if (response.success) {
        // Handle success - response.data can be single or array
        const uploadedVideo = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        // Call success callback
        if (onUploadSuccess) {
          onUploadSuccess(uploadedVideo);
        }

        // Reset form
        resetForm();
        onClose();
      } else {
        setError(response.message || "Upload failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (!uploading) {
      resetForm();
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop with blur effect */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[200]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Upload Content Video
            </h2>
            <button
              onClick={handleClose}
              disabled={uploading}
              className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 whitespace-pre-line">
                  {error}
                </p>
              </div>
            )}

            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video File <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                {preview ? (
                  <div className="relative aspect-video">
                    <video
                      src={preview}
                      controls
                      className="w-full h-full object-contain rounded-lg border border-gray-200 bg-black"
                    />
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                      aria-label="Remove video"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors aspect-video flex flex-col items-center justify-center"
                  >
                    <Video className="h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <span className="text-blue-600 font-medium">
                        Click to upload
                      </span>
                      <span className="text-gray-500"> or drag and drop</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 space-y-0.5 text-center">
                      <p>Note: The rule of upload content video.</p>
                      <ul className="list-disc list-outside pl-5 inline-block text-left">
                        <li>
                          The video must be in MP4, MPEG, MOV, AVI, or WebM
                          format.
                        </li>
                        <li>The video must be less than 2MB.</li>
                        <li>You can upload 1 video at a time.</li>
                      </ul>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={uploading}
              className="cursor-pointer px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="cursor-pointer flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
