"use client";
import { useState, useEffect } from "react";
import HeaderSponsor from "@/features/sponsor/headerSponsor";
import HeaderSidebar from "@/features/userFeature/headerSidebar";
import RightsideSponsor from "@/features/sponsor/rightsideSponsor";
import FooterFeature from "@/features/userFeature/footerFeature";
import { AdvertisementProvider } from "@/contexts/AdvertisementContext";
import { getAdvertisementImages } from "@/services/advertisement";
import { getSocialMedia } from "@/services/socialMedia";
import { getStatistics, type Statistics } from "@/services/statistics";
import type { AdvertisementImage } from "@/types/advertisement";
import type { SocialMedia } from "@/types/socialMedia";
import OrganizationStructuredData from "@/components/OrganizationStructuredData";

// Module-level flag so we only fetch once per app load (survives Strict Mode remount)
let publicLayoutHasFetched = false;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [adImages, setAdImages] = useState<AdvertisementImage[]>([]);
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (publicLayoutHasFetched) return;
    publicLayoutHasFetched = true;
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch advertisement images, social media, and statistics in parallel
      const [imagesResponse, socialMediaResponse, statisticsResponse] =
        await Promise.all([
          getAdvertisementImages(),
          getSocialMedia(),
          getStatistics().catch(() => ({ data: null })), // Don't fail if statistics fails
        ]);

      setAdImages(imagesResponse.data);
      setStatistics(statisticsResponse.data);

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

        const apiDataMap = new Map<string, SocialMedia>();
        const matchedApiIndexes = new Set<number>();
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

        // Prefer our fixed order, but keep any extra API platforms appended.
        const mergedData = orderedPlatforms.map((platform, index) => {
          const apiItem = apiDataMap.get(platform.toLowerCase());
          if (apiItem) {
            const apiIndex = socialMediaResponse.data.findIndex(
              (d) => d === apiItem,
            );
            if (apiIndex >= 0) matchedApiIndexes.add(apiIndex);
            return { ...apiItem, id: index + 1 };
          }
          const defaultItem = defaultPlatforms.find(
            (d) => d.name.toLowerCase() === platform.toLowerCase(),
          );
          return defaultItem || { id: index + 1, name: platform, link: "#" };
        });

        const extras = socialMediaResponse.data
          .map((item, idx) => ({ item, idx }))
          .filter(({ idx }) => !matchedApiIndexes.has(idx))
          .map(({ item }) => item)
          // Deduplicate any extras that accidentally match by name
          .filter((item) => {
            const normalized = item.name.toLowerCase().trim();
            return !orderedPlatforms.some((p) =>
              normalized.includes(p.toLowerCase()),
            );
          });

        const mergedWithExtras = [
          ...mergedData,
          ...extras.map((item, extraIdx) => ({
            ...item,
            id: mergedData.length + extraIdx + 1,
          })),
        ];

        setSocialMedia(mergedWithExtras);
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

  return (
    <AdvertisementProvider images={adImages} loading={loading}>
      {/* Organization structured data for Google News and Search */}
      <OrganizationStructuredData />
      <div>
        <HeaderSponsor images={adImages} loading={loading} />
        <HeaderSidebar />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content - 70% on desktop/tablet, full width on mobile */}
            <div className="w-full lg:w-full">{children}</div>
            {/* Right Side Sponsor - 30% on desktop/tablet, full width on mobile */}
            {/* <div className="w-full lg:w-[30%] lg:sticky lg:top-[124px] lg:self-start">
              <RightsideSponsor
                images={adImages}
                socialMedia={socialMedia}
                statistics={statistics}
                loading={loading}
              />
            </div> */}
          </div>
        </div>
        <FooterFeature />
      </div>
    </AdvertisementProvider>
  );
}
