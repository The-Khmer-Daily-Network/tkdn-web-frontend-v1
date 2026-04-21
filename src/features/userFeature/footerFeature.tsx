"use client";

import Image from "next/image";
import { Facebook, Youtube, Linkedin, Globe, Instagram, X } from "lucide-react";

// Custom TikTok Icon Component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);
// Logo from public/assets (transparent background)
const TKDN_LOGO_PATH = "/assets/TKDN_Logo/TKDNNews.png";

// Dummy social media links
const socialMediaLinks = [
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
    name: "Instagram",
    link: "https://www.instagram.com/thekhmerdailynetwork/",
  },
  { id: 6, name: "Twitter", link: "https://x.com/theK_DailyNews" },
  { id: 7, name: "Website", link: "https://www.thekhmerdailynetwork.com" },
];

// Map social media names to icons
const getSocialIcon = (name: string) => {
  const normalizedName = name.toLowerCase().trim();

  // Match exact or partial names for each platform
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
  if (normalizedName.includes("twitter") || normalizedName === "x") return X;
  if (
    normalizedName.includes("website") ||
    normalizedName.includes("web") ||
    normalizedName === "site"
  )
    return Globe;

  // Default to Globe icon for unknown platforms
  return Globe;
};

export default function FooterFeature() {
  return (
    <footer
      className="w-full bg-[#273C8F]/5"
      style={{ boxShadow: "0 2px 3px rgba(0, 0, 0, 0.5)" }}
  >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Logo */}
            <div className="flex items-center">
              <Image
                src={TKDN_LOGO_PATH}
                alt="THE KHMER Daily Network Logo"
                width={700}
                height={280}
                className="h-auto w-[250px] max-w-full"
                priority
              />
            </div>

            {/* Available On */}
            <div className="space-y-3">
              <p className="text-blue-900 font-bold text-sm">AVAILABLE ON</p>
              <div className="flex gap-3">
                {/* App Store Button */}
                <button className="flex items-center cursor-pointer gap-2 px-4 py-2 border-2 border-blue-900 rounded-lg hover:bg-blue-50 transition-colors">
                  <svg
                    className="w-5 h-5 text-blue-900"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  <span className="text-blue-900 font-medium text-sm">
                    App Store
                  </span>
                </button>

                {/* Google Play Button */}
                <button className="flex items-center cursor-pointer gap-2 px-4 py-2 border-2 border-blue-900 rounded-lg hover:bg-blue-50 transition-colors">
                  <svg
                    className="w-5 h-5 text-blue-900"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <span className="text-blue-900 font-medium text-sm">
                    Play Store
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Contact Heading */}
            <p className="text-blue-900 font-bold text-sm">GET TO KNOW US</p>

            {/* Contact Information */}
            <div className="space-y-2 text-sm text-gray-900">
              <p>Address: 2nd floor 87 Preah Sihanouk Blvd (274), Phnom Penh</p>
              <p>Phone Number: +855 77 241 913</p>
              <p>Email: thekhmerdailynetwork@gmail.com</p>
            </div>

            {/* Social Media Icons */}
            <div className="flex gap-3">
              {socialMediaLinks.map((social) => {
                const IconComponent = getSocialIcon(social.name);
                return (
                  <a
                    key={social.id}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center hover:bg-blue-800 transition-colors"
                    aria-label={social.name}
                >
                    <IconComponent className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Copyright Line */}
        <div className="border-t border-gray-300 pt-4">
          <p className="text-center text-sm text-blue-900">
            The Khmer Daily Network 2025
          </p>
        </div>
      </div>
    </footer>
  );
}
