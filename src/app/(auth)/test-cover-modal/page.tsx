"use client";

import { useState } from "react";
import CoverSelectorModal from "@/components/admin/CoverSelectorModal";
import SingleImageSelectorModal from "@/components/admin/SingleImageSelectorModal";
import MultipleImageSelectorModal from "@/components/admin/MultipleImageSelectorModal";
import VideoSelectorModal from "@/components/admin/VideoSelectorModal";
import type { ContentCover } from "@/types/contentCover";
import type { ContentImage } from "@/types/contentImage";
import type { ContentVideo } from "@/types/contentVideo";

export default function TestCoverModal() {
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isSingleImageModalOpen, setIsSingleImageModalOpen] = useState(false);
  const [isMultipleImageModalOpen, setIsMultipleImageModalOpen] =
    useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedCover, setSelectedCover] = useState<ContentCover | null>(null);
  const [selectedSingleImage, setSelectedSingleImage] =
    useState<ContentImage | null>(null);
  const [selectedMultipleImages, setSelectedMultipleImages] = useState<
    ContentImage[]
  >([]);
  const [selectedVideo, setSelectedVideo] = useState<ContentVideo | null>(null);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Modal Test Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cover Modal Test */}
        <div className="p-6 border border-gray-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            Test Cover Selector Modal
          </h2>
          <p className="text-gray-600 mb-4">
            Clicking a cover will select it and close the modal. You can also
            upload new covers.
          </p>
          <button
            onClick={() => setIsCoverModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Open Cover Selector Modal
          </button>

          {selectedCover && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-2">
                Selected Cover:
              </p>
              <div className="flex items-center gap-4">
                <img
                  src={selectedCover.image_url}
                  alt={selectedCover.title}
                  className="w-24 h-24 object-cover rounded"
                />
                <div>
                  <p className="font-semibold">{selectedCover.title}</p>
                  <p className="text-sm text-gray-600">
                    {selectedCover.original_name}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Middle Content - Single Image Test */}
        <div className="p-6 border border-gray-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            Test Middle Content (Single Image)
          </h2>
          <p className="text-gray-600 mb-4">
            Select only 1 image for middle content. Video support will be added
            in the future.
          </p>
          <button
            onClick={() => setIsSingleImageModalOpen(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Select Middle Content Image
          </button>

          {selectedSingleImage && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm font-medium text-purple-800 mb-2">
                Selected Middle Content:
              </p>
              <div className="flex items-center gap-4">
                <img
                  src={selectedSingleImage.image_url}
                  alt={selectedSingleImage.title}
                  className="w-24 h-24 object-cover rounded"
                />
                <div>
                  <p className="font-semibold">{selectedSingleImage.title}</p>
                  <p className="text-sm text-gray-600">
                    {selectedSingleImage.original_name}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Images - Multiple Images Test */}
        <div className="p-6 border border-gray-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            Test Additional Images (3 Images)
          </h2>
          <p className="text-gray-600 mb-4">
            Select up to 3 images for additional content. Click images to
            select, then confirm.
          </p>
          <button
            onClick={() => setIsMultipleImageModalOpen(true)}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            Select Additional Images
          </button>

          {selectedMultipleImages.length > 0 && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm font-medium text-orange-800 mb-2">
                Selected Additional Images ({selectedMultipleImages.length}/3):
              </p>
              <div className="grid grid-cols-3 gap-2">
                {selectedMultipleImages.map((image) => (
                  <div key={image.id} className="text-center">
                    <img
                      src={image.image_url}
                      alt={image.title}
                      className="w-full h-20 object-cover rounded"
                    />
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {image.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Video Selector Test */}
        <div className="p-6 border border-gray-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            Test Video Selector Modal
          </h2>
          <p className="text-gray-600 mb-4">
            Clicking a video will select it and close the modal. You can also
            upload new videos.
          </p>
          <button
            onClick={() => setIsVideoModalOpen(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Open Video Selector Modal
          </button>

          {selectedVideo && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-2">
                Selected Video:
              </p>
              <div className="flex items-center gap-4">
                <video
                  src={selectedVideo.video_url}
                  className="w-32 h-24 object-cover rounded"
                  controls
                />
                <div>
                  <p className="font-semibold">{selectedVideo.title}</p>
                  <p className="text-sm text-gray-600">
                    {selectedVideo.original_name}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-semibold mb-2">Testing Instructions:</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Click "Open Cover Selector Modal" to test selecting a cover</li>
          <li>Click "Select Middle Content Image" to test selecting 1 image</li>
          <li>
            Click "Select Additional Images" to test selecting up to 3 images
          </li>
          <li>Click "Open Video Selector Modal" to test selecting a video</li>
          <li>Click on any image/cover/video to select it</li>
          <li>For multiple images, click to select/deselect, then confirm</li>
          <li>Try clicking outside the modal (backdrop) to close it</li>
          <li>Try clicking the X button to close</li>
          <li>Test pagination if you have more than 15 items</li>
          <li>Click "Upload" buttons to upload new images/covers/videos</li>
        </ul>
      </div>

      {/* Modals */}
      <CoverSelectorModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        onSelect={(cover) => {
          setSelectedCover(cover);
          setIsCoverModalOpen(false);
        }}
      />

      <SingleImageSelectorModal
        isOpen={isSingleImageModalOpen}
        onClose={() => setIsSingleImageModalOpen(false)}
        onSelect={(image) => {
          setSelectedSingleImage(image);
          setIsSingleImageModalOpen(false);
        }}
      />

      <MultipleImageSelectorModal
        isOpen={isMultipleImageModalOpen}
        onClose={() => setIsMultipleImageModalOpen(false)}
        onSelect={(images) => {
          setSelectedMultipleImages(images);
          setIsMultipleImageModalOpen(false);
        }}
      />

      <VideoSelectorModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSelect={(video) => {
          setSelectedVideo(video);
          setIsVideoModalOpen(false);
        }}
      />
    </div>
  );
}
