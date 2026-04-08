"use client";
import Image from "next/image";
import type { AdvertisementImage } from "@/types/advertisement";

interface BannerSponsorProps {
  images?: AdvertisementImage[];
  loading?: boolean;
}

export default function BannerSponsor({
  images = [],
  loading = false,
}: BannerSponsorProps) {
  // Get image by position
  const getImageByPosition = (position: string): AdvertisementImage | null => {
    return images.find((img) => img.position === position) || null;
  };

  const bannerImage = getImageByPosition("Banner");

  if (loading || !bannerImage) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="relative w-full h-[200px] rounded-[10px] overflow-hidden">
        <Image
          src={bannerImage.image_url}
          alt="Banner Sponsor"
          fill
          className="object-cover"
          sizes="100vw"
          quality={100}
          unoptimized
          loading="eager"
        />
      </div>
    </div>
  );
}
