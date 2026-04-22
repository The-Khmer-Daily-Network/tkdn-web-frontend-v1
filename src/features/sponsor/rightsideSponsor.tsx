"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { getAdvertisementImages } from "@/services/advertisement";
import { getSocialMedia } from "@/services/socialMedia";
import type { AdvertisementImage } from "@/types/advertisement";
import type { SocialMedia } from "@/types/socialMedia";
import type { Statistics } from "@/services/statistics";
import TKDNLogo from "@/assets/TKDN_Logo/TKDN_Logo_NoneBack.png";
import SocialMediaWidget from "@/features/userFeature/socialMediaWidget";

// Responsive sizing: maintain aspect ratios and prevent overlap
// Base: 300px max height, 180px max width (aspect ratio 180/300 = 0.6)
// RightBig: 367px width, 650px height (aspect ratio 367/650 ≈ 0.565)
// Scale proportionally within container to avoid overlap

interface RightsideSponsorProps {
  images?: AdvertisementImage[];
  socialMedia?: SocialMedia[];
  statistics?: Statistics | null;
  loading?: boolean;
}

export default function RightsideSponsor(
  {
    images: propImages,
    socialMedia: propSocialMedia,
    statistics: propStatistics,
    loading: propLoading,
  }: RightsideSponsorProps = {} as RightsideSponsorProps,
) {
  const [images, setImages] = useState<AdvertisementImage[]>(propImages || []);
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>(
    propSocialMedia || [],
  );
  const [loading, setLoading] = useState(propLoading ?? true);

  useEffect(() => {
    // If data is provided as props, use it directly
    if (
      propImages &&
      propImages.length > 0 &&
      propSocialMedia &&
      propSocialMedia.length > 0
    ) {
      setImages(propImages);
      setSocialMedia(propSocialMedia);
      setLoading(false);
      return;
    }

    // Parent (e.g. public layout) is still loading — don't fetch; wait for props
    if (propLoading === true) return;

    // Otherwise, fetch the data (for backward compatibility when used without layout)
    fetchData();
  }, [propImages, propSocialMedia, propLoading]);

  const fetchData = async () => {
    try {
      // Fetch both advertisement images and social media in parallel
      const [imagesResponse, socialMediaResponse] = await Promise.all([
        getAdvertisementImages(),
        getSocialMedia(),
      ]);

      setImages(imagesResponse.data);

      // Process social media data (same logic as in SocialMediaWidget)
      const defaultPlatforms = [
        {
          id: 1,
          name: "Facebook",
          link: "https://www.facebook.com/TheKhmersDailyNetwork",
        },
        {
          id: 2,
          name: "YouTube",
          link: "https://www.youtube.com/@TheKhmerDailyNetworks",
        },
        { id: 3, name: "TikTok", link: "https://www.tiktok.com" },
        { id: 4, name: "LinkedIn", link: "https://www.linkedin.com" },
        {
          id: 5,
          name: "Website",
          link: "https://www.thekhmerdailynetwork.com",
        },
        { id: 6, name: "Instagram", link: "https://www.instagram.com" },
      ];

      if (socialMediaResponse.data && socialMediaResponse.data.length > 0) {
        const orderedPlatforms = [
          "Facebook",
          "YouTube",
          "TikTok",
          "LinkedIn",
          "Website",
          "Instagram",
        ];

        const apiDataMap = new Map();
        socialMediaResponse.data.forEach((item) => {
          const normalizedName = item.name.toLowerCase().trim();
          orderedPlatforms.forEach((platform) => {
            if (
              normalizedName.includes(platform.toLowerCase()) ||
              platform.toLowerCase().includes(normalizedName)
            ) {
              apiDataMap.set(platform.toLowerCase(), item);
            }
          });
        });

        const mergedData = orderedPlatforms.map((platform, index) => {
          const apiItem = apiDataMap.get(platform.toLowerCase());
          if (apiItem) {
            return { ...apiItem, id: index + 1 };
          }
          const defaultItem = defaultPlatforms.find(
            (d) => d.name.toLowerCase() === platform.toLowerCase(),
          );
          return defaultItem || { id: index + 1, name: platform, link: "#" };
        });

        setSocialMedia(mergedData);
      } else {
        setSocialMedia(defaultPlatforms);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      // Set default social media on error
      setSocialMedia([
        {
          id: 1,
          name: "Facebook",
          link: "https://www.facebook.com/TheKhmersDailyNetwork",
        },
        {
          id: 2,
          name: "YouTube",
          link: "https://www.youtube.com/@TheKhmerDailyNetworks",
        },
        { id: 3, name: "TikTok", link: "https://www.tiktok.com" },
        { id: 4, name: "LinkedIn", link: "https://www.linkedin.com" },
        {
          id: 5,
          name: "Website",
          link: "https://www.thekhmerdailynetwork.com",
        },
        { id: 6, name: "Instagram", link: "https://www.instagram.com" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Get images by position
  const getImageByPosition = (position: string): AdvertisementImage | null => {
    return images.find((img) => img.position === position) || null;
  };

  const baseStyle = {
    boxShadow: "0 0 0 rgba(0, 0, 0, 0.00)" as const,
  };

  if (loading) {
    return (
      <div className="w-full space-y-2 sm:space-y-4">
        {/* First Row: 2 columns skeleton */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {/* Column 1: Social Media Widget skeleton */}
          <div className="relative aspect-[3/5] max-w-[180px] max-h-[300px] w-full rounded-[10px] bg-gray-200 animate-pulse min-[402px]:hidden lg:block"></div>
          <div className="hidden min-[402px]:block lg:hidden relative aspect-[3/5] w-full rounded-[10px] bg-gray-200 animate-pulse"></div>

          {/* Column 2: TopRight skeleton */}
          <div className="relative aspect-[3/5] max-w-[180px] max-h-[300px] w-full rounded-[10px] bg-gray-200 animate-pulse min-[402px]:hidden lg:block"></div>
          <div className="hidden min-[402px]:block lg:hidden relative aspect-[3/5] w-full rounded-[10px] bg-gray-200 animate-pulse"></div>
        </div>

        {/* Second Row: 2 columns skeleton */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {/* Column 1: SecondRight skeleton */}
          <div className="relative aspect-[3/5] max-w-[180px] max-h-[300px] w-full rounded-[10px] bg-gray-200 animate-pulse min-[402px]:hidden lg:block"></div>
          <div className="hidden min-[402px]:block lg:hidden relative aspect-[3/5] w-full rounded-[10px] bg-gray-200 animate-pulse"></div>

          {/* Column 2: ThirdRight skeleton */}
          <div className="relative aspect-[3/5] max-w-[180px] max-h-[300px] w-full rounded-[10px] bg-gray-200 animate-pulse min-[402px]:hidden lg:block"></div>
          <div className="hidden min-[402px]:block lg:hidden relative aspect-[3/5] w-full rounded-[10px] bg-gray-200 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 sm:space-y-4">
      {/* First Row: 2 columns on all screens */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {/* Column 1: Social Media Info - visible on mobile/desktop, hidden on tablet */}
        <div
          className="relative overflow-hidden rounded-[10px] aspect-[3/5] w-full max-w-[180px] max-h-[300px] min-[402px]:hidden lg:block"
          style={baseStyle}
      >
          <SocialMediaWidget
            socialMediaData={socialMedia}
            statistics={propStatistics}
            loading={loading}
          />
        </div>

        {/* Column 1 on tablet: Social Media Info */}
        <div
          className="hidden min-[402px]:flex lg:hidden relative overflow-hidden rounded-[10px] aspect-[3/5] w-full max-w-none max-h-none"
          style={baseStyle}
      >
          <SocialMediaWidget
            socialMediaData={socialMedia}
            statistics={propStatistics}
            loading={loading}
          />
        </div>

        {/* Column 2: TopRight Image - visible on mobile/desktop */}
        <div
          className="flex min-[402px]:hidden lg:flex relative overflow-hidden items-center justify-center rounded-[10px] aspect-[3/5] w-full max-w-[180px] max-h-[300px]"
          style={baseStyle}
      >
          {getImageByPosition("TopRight") ? (
            <Image
              src={getImageByPosition("TopRight")!.image_url}
              alt="Top Right Sponsor"
              fill
              className="object-cover rounded-[10px]"
              sizes="(max-width: 1024px) 50vw, 15vw"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full rounded-[10px] flex items-center justify-center animate-pulse">
              <div className="relative w-[100px] h-[100px]">
                <Image
                  src={TKDNLogo}
                  alt="TKDN Logo"
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
            </div>
          )}
        </div>

        {/* Column 2 on tablet: TopRight Image */}
        <div
          className="hidden min-[402px]:flex lg:hidden relative overflow-hidden items-center justify-center rounded-[10px] aspect-[3/5] w-full max-w-none max-h-none"
          style={baseStyle}
      >
          {getImageByPosition("TopRight") ? (
            <Image
              src={getImageByPosition("TopRight")!.image_url}
              alt="Top Right Sponsor"
              fill
              className="object-cover rounded-[10px]"
              sizes="(max-width: 1024px) 50vw, 15vw"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full rounded-[10px] flex items-center justify-center animate-pulse">
              <div className="relative w-[100px] h-[100px]">
                <Image
                  src={TKDNLogo}
                  alt="TKDN Logo"
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Second Row: 2 columns on all screens */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {/* Column 1: SecondRight Sponsor - visible on mobile/desktop */}
        <div
          className="flex min-[402px]:hidden lg:flex relative overflow-hidden items-center justify-center rounded-[10px] aspect-[3/5] w-full max-w-[180px] max-h-[300px]"
          style={baseStyle}
      >
          {getImageByPosition("SecondRight") ? (
            <Image
              src={getImageByPosition("SecondRight")!.image_url}
              alt="Second Right Sponsor"
              fill
              className="object-cover rounded-[10px]"
              sizes="(max-width: 1024px) 50vw, 15vw"
            />
          ) : (
            <div className="w-full h-full rounded-[10px] flex items-center justify-center animate-pulse">
              <div className="relative w-[100px] h-[100px]">
                <Image
                  src={TKDNLogo}
                  alt="TKDN Logo"
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
            </div>
          )}
        </div>

        {/* Column 1 on tablet: SecondRight Sponsor */}
        <div
          className="hidden min-[402px]:flex lg:hidden relative overflow-hidden items-center justify-center rounded-[10px] aspect-[3/5] w-full max-w-none max-h-none"
          style={baseStyle}
      >
          {getImageByPosition("SecondRight") ? (
            <Image
              src={getImageByPosition("SecondRight")!.image_url}
              alt="Second Right Sponsor"
              fill
              className="object-cover rounded-[10px]"
              sizes="(max-width: 1024px) 50vw, 15vw"
            />
          ) : (
            <div className="w-full h-full rounded-[10px] flex items-center justify-center animate-pulse">
              <div className="relative w-[100px] h-[100px]">
                <Image
                  src={TKDNLogo}
                  alt="TKDN Logo"
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
            </div>
          )}
        </div>

        {/* Column 2: ThirdRight Sponsor - visible on mobile/desktop */}
        <div
          className="flex min-[402px]:hidden lg:flex relative overflow-hidden items-center justify-center rounded-[10px] aspect-[3/5] w-full max-w-[180px] max-h-[300px]"
          style={baseStyle}
      >
          {getImageByPosition("ThirdRight") ? (
            <Image
              src={getImageByPosition("ThirdRight")!.image_url}
              alt="Third Right Sponsor"
              fill
              className="object-cover rounded-[10px]"
              sizes="(max-width: 1024px) 50vw, 15vw"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full rounded-[10px] flex items-center justify-center animate-pulse">
              <div className="relative w-[100px] h-[100px]">
                <Image
                  src={TKDNLogo}
                  alt="TKDN Logo"
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
            </div>
          )}
        </div>

        {/* Column 2 on tablet: ThirdRight Sponsor */}
        <div
          className="hidden min-[402px]:flex lg:hidden relative overflow-hidden items-center justify-center rounded-[10px] aspect-[3/5] w-full max-w-none max-h-none"
          style={baseStyle}
      >
          {getImageByPosition("ThirdRight") ? (
            <Image
              src={getImageByPosition("ThirdRight")!.image_url}
              alt="Third Right Sponsor"
              fill
              className="object-cover rounded-[10px]"
              sizes="(max-width: 1024px) 50vw, 15vw"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full rounded-[10px] flex items-center justify-center animate-pulse">
              <div className="relative w-[100px] h-[100px]">
                <Image
                  src={TKDNLogo}
                  alt="TKDN Logo"
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
