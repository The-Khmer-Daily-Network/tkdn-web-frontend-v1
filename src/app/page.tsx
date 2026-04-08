import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "The Khmer Daily Network - Latest News, Articles & Videos",
  description:
    "The Khmer Daily Network is your trusted source for the latest news, articles, and videos. Stay informed with breaking news, in-depth coverage, and video reports from Cambodia and around the world.",
  keywords: [
    // Primary brand keywords
    "The Khmer Daily Network",
    "The Khmer",
    "Khmer Daily",
    "The Daily",
    "Khmer Network",
    "Daily Network",
    "TKDN",
    "TKDN news",

    // News-related keywords
    "News",
    "Khmer News",
    "International News",
    "Trust News",
    "New News",
    "Breaking News",
    "Latest News",
    "Current News",
    "Today News",
    "Daily News",
    "News Articles",
    "News Stories",
    "News Reports",
    "News Coverage",
    "News Updates",
    "News Headlines",

    // Cambodia & Khmer specific
    "Cambodia News",
    "Cambodia Breaking News",
    "Cambodia Latest News",
    "Khmer Breaking News",
    "Khmer Latest News",
    "Cambodian News",
    "Cambodian Daily News",
    "Phnom Penh News",
    "Cambodia Current Events",

    // Content type keywords
    "Video News",
    "News Videos",
    "Video Reports",
    "News Articles",
    "In-Depth Articles",
    "Feature Articles",
    "Editorial News",
    "Opinion News",

    // Trust & Quality keywords
    "Trusted News Source",
    "Reliable News",
    "Credible News",
    "Accurate News",
    "Quality Journalism",
    "Professional News",
    "Reputable News",

    // Category keywords
    "National News",
    "Local News",
    "Regional News",
    "World News",
    "Global News",
    "Politics News",
    "Business News",
    "Technology News",
    "Sports News",
    "Entertainment News",
    "Culture News",
    "Society News",

    // Search intent keywords
    "Read News",
    "Watch News",
    "News Online",
    "Online News",
    "Digital News",
    "News Website",
    "News Portal",
    "News Platform",
    "News Media",
    "News Organization",

    // Time-based keywords
    "Real-Time News",
    "Live News",
    "Up-to-Date News",
    "Fresh News",
    "Recent News",
    "News Today",
    "News Now",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "The Khmer Daily Network",
    title: "The Khmer Daily Network - Latest News, Articles & Videos",
    description:
      "The Khmer Daily Network is your trusted source for the latest news, articles, and videos. Stay informed with breaking news, in-depth coverage, and video reports from Cambodia and around the world.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://thekhmerdailynetwork.com",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://thekhmerdailynetwork.com"}/assets/TKDN_Logo/TKDN_Logo_Square.png`,
        width: 1200,
        height: 1200,
        alt: "The Khmer Daily Network Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Khmer Daily Network - Latest News, Articles & Videos",
    description:
      "The Khmer Daily Network is your trusted source for the latest news, articles, and videos. Stay informed with breaking news, in-depth coverage, and video reports from Cambodia and around the world.",
    images: [
      `${process.env.NEXT_PUBLIC_SITE_URL || "https://thekhmerdailynetwork.com"}/assets/TKDN_Logo/TKDN_Logo_Square.png`,
    ],
  },
};

export default function RootPage() {
  redirect("/home");
}
