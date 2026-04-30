"use client";
import Image from "next/image";
import type { AdvertisementImage } from "@/types/advertisement";

interface HeaderSponsorProps {
  images?: AdvertisementImage[];
  loading?: boolean;
}

export default function HeaderSponsor({
  images = [],
  loading = false,
}: HeaderSponsorProps) {
  // Get image by position
  const getImageByPosition = (position: string): AdvertisementImage | null => {
    return images.find((img) => img.position === position) || null;
  };

  const headerImage = getImageByPosition("Header");

  // Show skeleton while loading
  if (loading) {
    return (
      // <div className="sticky top-0 z-50 w-full overflow-hidden h-[30px]">
      <div className="sticky top-0 z-50 w-full overflow-hidden h-[0px]">
        <div
          className="flex animate-slide-right-responsive"
          style={{ width: "2880px" }}
      >
          <div className="relative shrink-0 h-[30px] w-[1440px] bg-gray-200 animate-pulse"></div>
          <div className="relative shrink-0 h-[30px] w-[1440px] bg-gray-200 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Return null if no header image after loading
  if (!headerImage) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 w-full overflow-hidden h-[30px]">
      <div
        className="flex animate-slide-right-responsive"
        style={{ width: "2880px" }}
    >
        <div className="relative shrink-0 h-[30px] w-[1440px]">
          <Image
            src={headerImage.image_url}
            alt="Header Sponsor"
            width={1440}
            height={30}
            className="object-cover"
            priority
            quality={100}
            unoptimized
            style={{ width: "1440px", height: "30px", display: "block" }}
          />
        </div>
        <div className="relative shrink-0 h-[30px] w-[1440px]">
          <Image
            src={headerImage.image_url}
            alt="Header Sponsor"
            width={1440}
            height={30}
            className="object-cover"
            priority
            quality={100}
            unoptimized
            style={{ width: "1440px", height: "30px", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}
