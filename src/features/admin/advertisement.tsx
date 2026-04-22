"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import {
  getAdvertisements,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  getAdvertisementImages,
  uploadAdvertisementImage,
  deleteAdvertisementImage,
} from "@/services/advertisement";
import type { Advertisement, AdvertisementImage } from "@/types/advertisement";

// Import sample interface images
import sponsorTopRight from "@/assets/advertisement/sampleInterface/sponsorTopRight.png";
import sponsorThirdRight from "@/assets/advertisement/sampleInterface/sponsorThirdRight.png";
import sponsorSecondRight from "@/assets/advertisement/sampleInterface/sponsorSecondRight.png";
import sponsorRightBig from "@/assets/advertisement/sampleInterface/sponsorRightBig.png";
import sponsorHeader from "@/assets/advertisement/sampleInterface/sponsorHeader.png";
import sponsorBanner from "@/assets/advertisement/sampleInterface/sponsorBanner.png";

// Position mapping from image names
const POSITION_IMAGES = [
  {
    image: sponsorTopRight,
    name: "sponsorTopRight",
    position: "TopRight",
    label: "Top Right",
  },
  {
    image: sponsorThirdRight,
    name: "sponsorThirdRight",
    position: "ThirdRight",
    label: "Third Right",
  },
  {
    image: sponsorSecondRight,
    name: "sponsorSecondRight",
    position: "SecondRight",
    label: "Second Right",
  },
  {
    image: sponsorRightBig,
    name: "sponsorRightBig",
    position: "RightBig",
    label: "Right Big",
  },
  {
    image: sponsorHeader,
    name: "sponsorHeader",
    position: "Header",
    label: "Header",
  },
  {
    image: sponsorBanner,
    name: "sponsorBanner",
    position: "Banner",
    label: "Banner",
  },
];

// Upload Image Modal
interface UploadImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function UploadImageModal({
  isOpen,
  onClose,
  onSuccess,
}: UploadImageModalProps) {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedPosition(null);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  const handlePositionSelect = (position: string) => {
    setSelectedPosition(position);
    setError(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedPosition) {
      setError(
        "Please select a position first by clicking on one of the sample interface images",
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      setIsUploadingImage(true);
      setError(null);

      await uploadAdvertisementImage(file, selectedPosition);

      // Reset form
      setSelectedPosition(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
      >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
            <h2 className="text-xl font-semibold text-gray-900">
              Upload Advertisement Image
            </h2>
            <button
              onClick={onClose}
              disabled={isUploadingImage}
              className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Step 1: Position Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Step 1: Select Position <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {POSITION_IMAGES.map((pos) => {
                  const isSelected = selectedPosition === pos.position;

                  return (
                    <button
                      key={pos.position}
                      type="button"
                      onClick={() => handlePositionSelect(pos.position)}
                      disabled={isUploadingImage}
                      className={`relative border-2 rounded-lg overflow-hidden transition-all ${
                        isSelected
                          ? "border-blue-500 ring-2 ring-blue-200 shadow-md"
                          : "border-gray-200 hover:border-blue-300"
                      } ${isUploadingImage ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                      <div className="aspect-video bg-gray-100 relative">
                        <Image
                          src={pos.image}
                          alt={pos.label}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="p-2 bg-white border-t border-gray-200">
                        <p className="text-xs font-medium text-center text-gray-900">
                          {pos.label}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedPosition && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ Selected:{" "}
                  <span className="font-semibold">
                    {
                      POSITION_IMAGES.find(
                        (p) => p.position === selectedPosition,
                      )?.label
                    }
                  </span>
                </p>
              )}
              {!selectedPosition && (
                <p className="mt-2 text-sm text-amber-600">
                  Please select a position to continue
                </p>
              )}
            </div>

            {/* Step 2: Upload Image */}
            {selectedPosition && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Step 2: Upload Image <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-blue-50 rounded-full">
                      <Upload size={32} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        Choose Image File
                      </h3>
                      <p className="text-xs text-gray-500 mb-4">
                        Select an image file from your device
                      </p>
                    </div>
                    <label
                      className={`w-full max-w-xs cursor-pointer px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        isUploadingImage
                          ? "bg-blue-400 text-white cursor-wait"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                  >
                      {isUploadingImage ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          <span>Choose File</span>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploadingImage}
                      />
                    </label>
                    <p className="text-xs text-gray-400">
                      Supported formats: JPG, PNG, GIF, WebP (Max 10MB)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Advertisement Modal (Create/Edit)
interface AdvertisementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  advertisement?: Advertisement | null;
}

function AdvertisementModal({
  isOpen,
  onClose,
  onSuccess,
  advertisement,
}: AdvertisementModalProps) {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image selection states
  const [availableImages, setAvailableImages] = useState<AdvertisementImage[]>(
    [],
  );
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  // Fetch available images when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableImages();
    }
  }, [isOpen]);

  useEffect(() => {
    if (advertisement) {
      setName(advertisement.name);
      setImageUrl(advertisement.image_url || "");
      // Find the position of the current advertisement's image
      if (advertisement.image_url && availableImages.length > 0) {
        const matchingImage = availableImages.find(
          (img: AdvertisementImage) =>
            img.image_url === advertisement.image_url,
        );
        if (matchingImage) {
          setSelectedPosition(matchingImage.position);
        }
      }
    } else {
      setName("");
      setImageUrl("");
      setSelectedPosition(null);
    }
    setError(null);
  }, [advertisement, isOpen, availableImages]);

  useEffect(() => {
    if (showImageSelector) {
      fetchAvailableImages();
    }
  }, [showImageSelector]);

  const fetchAvailableImages = async () => {
    try {
      const response = await getAdvertisementImages();
      setAvailableImages(response.data);
    } catch (err) {
      console.error("Error fetching images:", err);
    }
  };

  const handlePositionSelect = (position: string) => {
    setSelectedPosition(position);
    setError(null);
    // Auto-open image selector when position is selected
    setShowImageSelector(true);
  };

  const handleSelectImage = (image: AdvertisementImage) => {
    setImageUrl(image.image_url);
    setShowImageSelector(false);
  };

  const handleDeleteImage = async (
    e: React.MouseEvent,
    imageId: number,
    imageUrlToDelete: string,
  ) => {
    e.stopPropagation(); // Prevent selecting the image when clicking delete

    if (
      !confirm(
        "Are you sure you want to delete this image? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setDeletingImageId(imageId);
      setError(null);

      await deleteAdvertisementImage(imageId);

      // If the deleted image was selected, clear the selection
      if (imageUrl === imageUrlToDelete) {
        setImageUrl("");
      }

      // Refresh the images list
      await fetchAvailableImages();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete image";
      setError(errorMessage);
    } finally {
      setDeletingImageId(null);
    }
  };

  // Filter images by selected position
  const filteredImages = selectedPosition
    ? availableImages.filter(
        (img: AdvertisementImage) => img.position === selectedPosition,
      )
    : availableImages;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (advertisement) {
        // Update existing advertisement
        await updateAdvertisement(advertisement.id, {
          name: name.trim(),
          image_url: imageUrl.trim() || null,
        });
      } else {
        // Create new advertisement
        await createAdvertisement({
          name: name.trim(),
          image_url: imageUrl.trim() || null,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save advertisement";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
      >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
            <h2 className="text-xl font-semibold text-gray-900">
              {advertisement ? "Edit" : "Create"} Advertisement
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter advertisement name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advertisement Image
              </label>
              <div className="space-y-4">
                {/* Step 1: Position Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Step 1: Select Position
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {POSITION_IMAGES.map((pos) => {
                      const isSelected = selectedPosition === pos.position;

                      return (
                        <button
                          key={pos.position}
                          type="button"
                          onClick={() => handlePositionSelect(pos.position)}
                          disabled={loading}
                          className={`relative border-2 rounded-lg overflow-hidden transition-all ${
                            isSelected
                              ? "border-blue-500 ring-2 ring-blue-200 shadow-md"
                              : "border-gray-200 hover:border-blue-300"
                          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                          <div className="aspect-video bg-gray-100 relative">
                            <Image
                              src={pos.image}
                              alt={pos.label}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div className="p-2 bg-white border-t border-gray-200">
                            <p className="text-xs font-medium text-center text-gray-900">
                              {pos.label}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedPosition && (
                    <p className="mt-2 text-sm text-green-600">
                      ✓ Selected:{" "}
                      <span className="font-semibold">
                        {
                          POSITION_IMAGES.find(
                            (p) => p.position === selectedPosition,
                          )?.label
                        }
                      </span>
                    </p>
                  )}
                </div>

                {/* Step 2: Image Selection */}
                {selectedPosition && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Step 2: Select Image from{" "}
                      {
                        POSITION_IMAGES.find(
                          (p) => p.position === selectedPosition,
                        )?.label
                      }
                    </label>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Available Images ({filteredImages.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() =>
                            setShowImageSelector(!showImageSelector)
                          }
                          className="text-xs text-gray-500 hover:text-gray-700"
                      >
                          {showImageSelector ? "Hide" : "Show"}
                        </button>
                      </div>
                      {filteredImages.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No images available for this position. Please upload
                          an image for{" "}
                          {
                            POSITION_IMAGES.find(
                              (p) => p.position === selectedPosition,
                            )?.label
                          }{" "}
                          first.
                        </p>
                      ) : (
                        <>
                          {showImageSelector && (
                            <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                              {filteredImages.map((image) => (
                                <div
                                  key={image.id}
                                  onClick={() => handleSelectImage(image)}
                                  className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all group ${
                                    imageUrl === image.image_url
                                      ? "border-blue-500 ring-2 ring-blue-200 shadow-md"
                                      : "border-gray-200 hover:border-blue-300"
                                  }`}
                              >
                                  <img
                                    src={image.image_url}
                                    alt={image.position}
                                    className="w-full h-24 object-cover"
                                  />
                                  <p
                                    className="text-xs text-center p-2 bg-white truncate font-medium"
                                    title={image.position}
                                >
                                    {image.position}
                                  </p>
                                  {/* Delete button in top right */}
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      handleDeleteImage(
                                        e,
                                        image.id,
                                        image.image_url,
                                      )
                                    }
                                    disabled={deletingImageId === image.id}
                                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg z-10"
                                    title="Delete image"
                                >
                                    {deletingImageId === image.id ? (
                                      <Loader2
                                        size={12}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <Trash2 size={12} />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Manual URL Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Or enter image URL manually:
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black text-sm"
                    disabled={loading}
                  />
                </div>

                {/* Image Preview */}
                {imageUrl && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image Preview:
                    </label>
                    <div className="flex items-start gap-4">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 shadow-sm"
                        onError={() => {
                          // Image failed to load
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">URL:</span>{" "}
                          {imageUrl.length > 60
                            ? `${imageUrl.substring(0, 60)}...`
                            : imageUrl}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="cursor-pointer px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
                {loading ? "Saving..." : advertisement ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function Advertisement() {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [advertisementImages, setAdvertisementImages] = useState<
    AdvertisementImage[]
>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadImageModalOpen, setIsUploadImageModalOpen] = useState(false);
  const [selectedAdvertisement, setSelectedAdvertisement] =
    useState<Advertisement | null>(null);

  useEffect(() => {
    fetchAdvertisements();
    fetchAdvertisementImages();
  }, []);

  // Debug: Log data when it changes
  useEffect(() => {
    if (advertisements.length > 0 && advertisementImages.length > 0) {
      console.log("=== Advertisement Debug Info ===");
      console.log("Advertisements:", advertisements);
      console.log("Advertisement Images:", advertisementImages);
      console.log(
        "POSITION_IMAGES:",
        POSITION_IMAGES.map((p) => p.position),
      );
    }
  }, [advertisements, advertisementImages]);

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdvertisements();
      setAdvertisements(response.data);
    } catch (err) {
      console.error("Error fetching advertisements:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch advertisements",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvertisementImages = async () => {
    try {
      const response = await getAdvertisementImages();
      setAdvertisementImages(response.data);
    } catch (err) {
      console.error("Error fetching advertisement images:", err);
    }
  };

  // Normalize URL for comparison (remove trailing slashes, decode)
  const normalizeUrl = (url: string | null): string => {
    if (!url) return "";
    try {
      // Decode URL encoding and remove trailing slashes
      return decodeURIComponent(url).trim().replace(/\/+$/, "");
    } catch {
      return url.trim().replace(/\/+$/, "");
    }
  };

  // Normalize position name for comparison (case-insensitive, trim whitespace, normalize separators)
  const normalizePosition = (position: string | null | undefined): string => {
    if (!position) return "";
    // Remove all whitespace, underscores, hyphens and convert to lowercase for comparison
    return position
      .trim()
      .replace(/[\s\-_]+/g, "")
      .toLowerCase();
  };

  // Get position image for an advertisement
  const getPositionImageForAdvertisement = (advertisement: Advertisement) => {
    if (!advertisement.image_url) return null;

    const normalizedAdUrl = normalizeUrl(advertisement.image_url);

    // Find the advertisement image that matches this advertisement's image_url
    const matchingImage = advertisementImages.find(
      (img: AdvertisementImage) => {
        if (!img.image_url) return false;
        const normalizedImgUrl = normalizeUrl(img.image_url);
        return normalizedImgUrl === normalizedAdUrl;
      },
    );

    if (matchingImage && matchingImage.position) {
      const normalizedMatchingPosition = normalizePosition(
        matchingImage.position,
      );

      // Find the position image from POSITION_IMAGES (case-insensitive comparison)
      const positionImage = POSITION_IMAGES.find((pos) => {
        const normalizedPosPosition = normalizePosition(pos.position);
        return normalizedPosPosition === normalizedMatchingPosition;
      });

      if (positionImage) {
        return positionImage.image;
      }

      // Log if position is not found in POSITION_IMAGES
      console.warn(
        `Position "${matchingImage.position}" (normalized: "${normalizedMatchingPosition}") not found in POSITION_IMAGES. Available positions:`,
        POSITION_IMAGES.map((p) => p.position),
      );
    } else if (advertisement.image_url) {
      // Debug: log when no matching image is found
      console.warn(
        `No matching advertisement image found for URL: ${advertisement.image_url}`,
      );
      console.warn(
        `Available images:`,
        advertisementImages.map((img) => ({
          id: img.id,
          position: img.position,
          url: img.image_url,
        })),
      );
    }

    return null;
  };

  const handleCreateAdvertisement = () => {
    setSelectedAdvertisement(null);
    setIsCreateModalOpen(true);
  };

  const handleEditAdvertisement = (advertisement: Advertisement) => {
    setSelectedAdvertisement(advertisement);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this advertisement?")) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteAdvertisement(id);
      await fetchAdvertisements();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete advertisement";
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading advertisements...</p>
      </div>
    );
  }

  if (error && advertisements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button
          onClick={fetchAdvertisements}
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
            Advertisement Management
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsUploadImageModalOpen(true)}
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm text-sm"
          >
              <Upload size={16} />
              Upload Image
            </button>
            <button
              onClick={handleCreateAdvertisement}
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm text-sm"
          >
              <Plus size={16} />
              Add Advertisement
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}

        {advertisements.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 mb-4">No advertisements found.</p>
              <button
                onClick={handleCreateAdvertisement}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
                Create Your First Advertisement
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {advertisements.map((ad) => {
              const positionImage = getPositionImageForAdvertisement(ad);
              const normalizedAdUrl = normalizeUrl(ad.image_url);
              const matchingImage = advertisementImages.find(
                (img: AdvertisementImage) => {
                  if (!img.image_url) return false;
                  const normalizedImgUrl = normalizeUrl(img.image_url);
                  return normalizedImgUrl === normalizedAdUrl;
                },
              );

              return (
                <div
                  key={ad.id}
                  className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                  <div className="w-full h-48 bg-gray-100 overflow-hidden relative">
                    {positionImage ? (
                      <Image
                        src={positionImage}
                        alt={ad.name}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-sm p-4">
                        <p>No position image</p>
                        {ad.image_url && (
                          <p className="text-xs mt-2 text-gray-300 text-center break-all">
                            {matchingImage
                              ? `Position: ${matchingImage.position}`
                              : "No matching image found"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {ad.name || "Untitled Advertisement"}
                    </h3>
                    {matchingImage && (
                      <p className="text-xs text-gray-500 mt-1">
                        Position: {matchingImage.position}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => handleEditAdvertisement(ad)}
                        className="cursor-pointer flex-1 px-3 py-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                        <Edit2 size={14} className="inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        disabled={deletingId === ad.id}
                        className="cursor-pointer flex-1 px-3 py-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                        <Trash2 size={14} className="inline mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <UploadImageModal
        isOpen={isUploadImageModalOpen}
        onClose={() => setIsUploadImageModalOpen(false)}
        onSuccess={() => {
          // Refresh images list if needed
          fetchAdvertisementImages();
          setIsUploadImageModalOpen(false);
        }}
      />

      <AdvertisementModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchAdvertisements();
          fetchAdvertisementImages();
        }}
      />

      <AdvertisementModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAdvertisement(null);
        }}
        onSuccess={() => {
          fetchAdvertisements();
          fetchAdvertisementImages();
        }}
        advertisement={selectedAdvertisement}
      />
    </div>
  );
}
