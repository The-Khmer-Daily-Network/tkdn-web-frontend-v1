"use client";

import { useState, useEffect } from "react";
import { getSocialMedia } from "@/services/socialMedia";
import {
  getStatistics,
  type Statistics as StatisticsType,
} from "@/services/statistics";
import type { SocialMedia } from "@/types/socialMedia";
import { Facebook, Youtube, Linkedin, Globe, Instagram } from "lucide-react";

// Custom TikTok Icon Component
const TikTokIcon = ({
  className,
  strokeWidth = 1.5,
}: {
  className?: string;
  strokeWidth?: number;
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

// Map social media names to icons
const getSocialIcon = (name: string) => {
  const normalizedName = name.toLowerCase().trim();

  if (normalizedName.includes("facebook") || normalizedName === "fb")
    return Facebook;
  if (normalizedName.includes("youtube") || normalizedName === "yt")
    return Youtube;
  if (normalizedName.includes("tiktok") || normalizedName === "tt")
    return TikTokIcon;
  if (normalizedName.includes("linkedin") || normalizedName === "li")
    return Linkedin;
  if (normalizedName.includes("instagram") || normalizedName === "ig")
    return Instagram;
  if (
    normalizedName.includes("website") ||
    normalizedName.includes("web") ||
    normalizedName === "site"
  )
    return Globe;

  // Default to Globe icon for unknown platforms
  return Globe;
};

// Format platform name for display
const formatPlatformName = (name: string): string => {
  const normalizedName = name.toLowerCase().trim();

  if (normalizedName.includes("tiktok")) return "Tik Tok";
  if (normalizedName.includes("instagram")) return "Instgram"; // Matching the image typo

  // Capitalize first letter of each word
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Format number to display format (e.g., 49800 -> "49.8K")
const formatFollowerCount = (count: number): string => {
  if (count === 0) return "0";

  if (count >= 1000000) {
    const millions = count / 1000000;
    return `${millions.toFixed(1)}M`;
  }

  if (count >= 1000) {
    const thousands = count / 1000;
    return `${thousands.toFixed(1)}K`;
  }

  return count.toString();
};

// Get follower count for each platform from statistics
const getFollowerCount = (
  name: string,
  statistics: StatisticsType | null,
): string => {
  if (!statistics) return "0";

  const normalizedName = name.toLowerCase().trim();

  if (normalizedName.includes("facebook") || normalizedName === "fb") {
    return formatFollowerCount(statistics.facebook || 0);
  }
  if (normalizedName.includes("youtube") || normalizedName === "yt") {
    return formatFollowerCount(statistics.youtube || 0);
  }
  if (normalizedName.includes("tiktok") || normalizedName === "tt") {
    return formatFollowerCount(statistics.tiktok || 0);
  }
  if (normalizedName.includes("linkedin") || normalizedName === "li") {
    return formatFollowerCount(statistics.linkedin || 0);
  }
  if (normalizedName.includes("instagram") || normalizedName === "ig") {
    return formatFollowerCount(statistics.instagram || 0);
  }
  if (
    normalizedName.includes("website") ||
    normalizedName.includes("web") ||
    normalizedName === "site"
  ) {
    return formatFollowerCount(statistics.website || 0);
  }

  // Default fallback
  return "0";
};

interface SocialMediaWidgetProps {
  socialMediaData?: SocialMedia[];
  statistics?: StatisticsType | null;
  loading?: boolean;
}

export default function SocialMediaWidget({
  socialMediaData,
  statistics: propStatistics,
  loading: externalLoading,
}: SocialMediaWidgetProps) {
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([]);
  const [statistics, setStatistics] = useState<StatisticsType | null>(
    propStatistics || null,
  );
  const [loading, setLoading] = useState(externalLoading ?? true);

  // Update statistics when prop changes
  useEffect(() => {
    if (propStatistics) {
      setStatistics(propStatistics);
    }
  }, [propStatistics]);

  // Fetch statistics at most once per mount when not provided as prop (avoids refire when socialMediaData changes)
  useEffect(() => {
    if (propStatistics) return;
    let cancelled = false;
    const fetchStatistics = async () => {
      try {
        const response = await getStatistics();
        if (!cancelled) setStatistics(response.data);
      } catch (error) {
        if (!cancelled) console.error("Error fetching statistics:", error);
      }
    };
    fetchStatistics();
    return () => {
      cancelled = true;
    };
  }, [propStatistics]);

  useEffect(() => {
    // If data is provided as prop, use it directly
    if (socialMediaData && socialMediaData.length > 0) {
      setSocialMedia(socialMediaData);
      setLoading(false);
      return;
    }

    // Otherwise, fetch the data (for backward compatibility)
    const fetchSocialMedia = async () => {
      try {
        const response = await getSocialMedia();
        console.log("Social Media API Response:", response);

        // Default platforms with fallback links (same as footer)
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
          {
            id: 3,
            name: "TikTok",
            link: "https://www.tiktok.com/@thekhmerdailynetwork",
          },
          {
            id: 4,
            name: "LinkedIn",
            link: "https://www.linkedin.com/in/the-khmer-daily-network-a8625238a/",
          },
          {
            id: 5,
            name: "Website",
            link: "https://www.thekhmerdailynetwork.com",
          },
          {
            id: 6,
            name: "Instagram",
            link: "https://www.instagram.com/thekhmerdailynetwork/",
          },
        ];

        // If API returns data, merge with defaults (prioritize API data)
        if (response.data && response.data.length > 0) {
          const orderedPlatforms = [
            "Facebook",
            "YouTube",
            "TikTok",
            "LinkedIn",
            "Website",
            "Instagram",
          ];

          // Create a map of API data by normalized name
          const apiDataMap = new Map<string, SocialMedia>();
          const matchedApiIndexes = new Set<number>();
          response.data.forEach((item) => {
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

          // Helper function to check if link is incomplete (just base URL)
          const checkIncompleteLink = (link: string): boolean => {
            if (!link || link === "#") return true;
            const normalizedLink = link.trim().replace(/\/$/, ""); // Remove trailing slash

            // Define base URLs that are considered incomplete
            const incompleteLinks = [
              "https://www.instagram.com",
              "https://instagram.com",
              "https://www.tiktok.com",
              "https://tiktok.com",
              "https://www.linkedin.com",
              "https://linkedin.com",
              "https://www.facebook.com",
              "https://facebook.com",
              "https://www.youtube.com",
              "https://youtube.com",
            ];

            return incompleteLinks.some(
              (baseUrl) =>
                normalizedLink === baseUrl || normalizedLink === `${baseUrl}/`,
            );
          };

          // Merge: use API data if available, otherwise use default
          // If API link is incomplete (just base URL), mark it as non-clickable
          const mergedData = orderedPlatforms.map((platform, index) => {
            const apiItem = apiDataMap.get(platform.toLowerCase());
            const defaultItem = defaultPlatforms.find(
              (d) => d.name.toLowerCase() === platform.toLowerCase(),
            );

            if (apiItem) {
              const apiIndex = response.data.findIndex((d) => d === apiItem);
              if (apiIndex >= 0) matchedApiIndexes.add(apiIndex);
              const link = apiItem.link || "";
              const hasIncompleteLink = checkIncompleteLink(link);

              // If incomplete, use default link if available, otherwise mark as non-clickable
              const finalLink =
                hasIncompleteLink && defaultItem
                  ? defaultItem.link
                  : link || defaultItem?.link || "#";

              const isClickable =
                !checkIncompleteLink(finalLink) && finalLink !== "#";

              return {
                ...apiItem,
                id: index + 1,
                link: finalLink,
                isClickable,
              };
            }

            // Use default if no API data
            const defaultLink = defaultItem?.link || "#";
            return {
              ...(defaultItem || { id: index + 1, name: platform, link: "#" }),
              isClickable:
                !checkIncompleteLink(defaultLink) && defaultLink !== "#",
            };
          });

          // Keep any extra API platforms appended after the fixed order.
          const extras = response.data
            .map((item, idx) => ({ item, idx }))
            .filter(({ idx }) => !matchedApiIndexes.has(idx))
            .map(({ item }) => item)
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
              link: item.link || "#",
              isClickable: item.link ? !checkIncompleteLink(item.link) : false,
            })),
          ];

          console.log("Merged Social Media:", mergedWithExtras);
          setSocialMedia(mergedWithExtras);
        } else {
          // If API returns empty, use defaults
          console.log("No data from API, using defaults");
          setSocialMedia(defaultPlatforms);
        }
      } catch (error) {
        console.error("Error fetching social media:", error);
        // Fallback to default social media if API fails (same as footer)
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
          {
            id: 3,
            name: "TikTok",
            link: "https://www.tiktok.com/@thekhmerdailynetwork",
          },
          {
            id: 4,
            name: "LinkedIn",
            link: "https://www.linkedin.com/in/the-khmer-daily-network-a8625238a/",
          },
          {
            id: 5,
            name: "Website",
            link: "https://www.thekhmerdailynetwork.com",
          },
          {
            id: 6,
            name: "Instagram",
            link: "https://www.instagram.com/thekhmerdailynetwork/",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchSocialMedia();
  }, [socialMediaData]);

  if (loading) {
    return (
      <div className="w-full rounded-[10px] overflow-hidden bg-gray-200 animate-pulse">
        <div className="h-16 bg-gray-300"></div>
        <div className="h-48 bg-gray-100"></div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full rounded-[10px] overflow-hidden flex flex-col"
      style={{ boxShadow: "0 0 0 rgba(0, 0, 0, 0.00)" }}
    >
      {/* Header - Dark Blue */}
      <div className="bg-[#273C8F] px-3 py-2.5 flex-shrink-0">
        <h3 className="text-white font-bold text-base max-[1023px]:text-base min-[1024px]:max-[1091px]:text-xs min-[1092px]:text-sm">
          Follow Us
        </h3>
        <p className="text-white text-xs max-[1023px]:text-xs min-[1024px]:max-[1091px]:text-[9px] min-[1092px]:text-[10px] font-normal">
          The Khmer Daily Network
        </p>
      </div>

      {/* Body - Light Grey */}
      <div className="bg-gray-100 px-3 py-2 space-y-1 flex-1 flex flex-col justify-center">
        {socialMedia.length > 0 ? (
          socialMedia.map((social, index) => {
            const IconComponent = getSocialIcon(social.name);
            const displayName = formatPlatformName(social.name);
            const followerCount = getFollowerCount(social.name, statistics);

            // Check if link is incomplete (base URL only) - use isClickable property or check link
            const link = (social as any).link || social.link || "#";

            // Helper function to check if link is incomplete (same logic as above)
            const checkLinkIncomplete = (linkToCheck: string): boolean => {
              if (!linkToCheck || linkToCheck === "#") return true;
              const normalizedLink = linkToCheck.trim().replace(/\/$/, "");
              const incompleteLinks = [
                "https://www.instagram.com",
                "https://instagram.com",
                "https://www.tiktok.com",
                "https://tiktok.com",
                "https://www.linkedin.com",
                "https://linkedin.com",
                "https://www.facebook.com",
                "https://facebook.com",
                "https://www.youtube.com",
                "https://youtube.com",
              ];
              return incompleteLinks.some(
                (baseUrl) =>
                  normalizedLink === baseUrl ||
                  normalizedLink === `${baseUrl}/`,
              );
            };

            // Platforms that should always be display-only (non-clickable)
            const displayOnlyPlatforms = [
              "Facebook",
              "YouTube",
              "Website",
              "TikTok",
              "Instagram",
            ];
            const isDisplayOnly = displayOnlyPlatforms.some((platform) =>
              social.name.toLowerCase().includes(platform.toLowerCase()),
            );

            // Check if link is incomplete OR if it's a display-only platform
            const isClickable =
              !isDisplayOnly &&
              (social as any).isClickable !== false &&
              link !== "#" &&
              !checkLinkIncomplete(link);

            const content = (
              <>
                {/* Icon - Left */}
                <div className="shrink-0 w-5 h-5 max-[1023px]:w-6 max-[1023px]:h-6 min-[1024px]:max-[1091px]:w-4 min-[1024px]:max-[1091px]:h-4 min-[1092px]:w-5 min-[1092px]:h-5 flex items-center justify-center">
                  {social.name.toLowerCase().includes("tiktok") ? (
                    <TikTokIcon
                      className="w-5 h-5 max-[1023px]:w-5 max-[1023px]:h-5 min-[1024px]:max-[1091px]:w-3.5 min-[1024px]:max-[1091px]:h-3.5 min-[1092px]:w-4 min-[1092px]:h-4 text-gray-600"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <IconComponent
                      className="w-5 h-5 max-[1023px]:w-5 max-[1023px]:h-5 min-[1024px]:max-[1091px]:w-3.5 min-[1024px]:max-[1091px]:h-3.5 min-[1092px]:w-4 min-[1092px]:h-4 text-gray-600"
                      strokeWidth={1.5}
                    />
                  )}
                </div>

                {/* Platform Name - Middle */}
                <div className="flex-1 px-2">
                  <span className="text-sm max-[1023px]:text-sm min-[1024px]:max-[1091px]:text-[10px] min-[1092px]:text-xs text-[#1D2229] font-normal">
                    {displayName}
                  </span>
                </div>

                {/* Follower Count - Right */}
                <div className="shrink-0">
                  <span className="text-sm max-[1023px]:text-sm min-[1024px]:max-[1091px]:text-[10px] min-[1092px]:text-xs text-gray-600">
                    {followerCount}
                  </span>
                </div>
              </>
            );

            // Render as link if clickable, otherwise as div (display only)
            // Keep same styling for both - no visual difference
            if (isClickable) {
              return (
                <a
                  key={`${social.id || index}-${social.name}-${index}`}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center w-full hover:opacity-80 transition-opacity cursor-pointer py-0.5"
                >
                  {content}
                </a>
              );
            } else {
              return (
                <div
                  key={`${social.id || index}-${social.name}-${index}`}
                  className="flex items-center w-full py-0.5"
                >
                  {content}
                </div>
              );
            }
          })
        ) : (
          <p className="text-sm text-gray-600 text-center py-4">
            No social media links available
          </p>
        )}
      </div>
    </div>
  );
}
