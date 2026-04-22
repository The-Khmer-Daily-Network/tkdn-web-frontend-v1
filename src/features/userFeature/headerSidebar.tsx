"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronDown, Search } from "lucide-react";
import TKDNLogo from "@/assets/TKDN_Logo/TKDN_Logo_Big.png";
import { getCategories } from "@/services/category";
import { categoryNameToSlug } from "@/utils/slug";
import type { Category } from "@/types/category";

// Social media links mapping
const getSocialMediaLink = (name: string): string | null => {
  const normalizedName = name.toLowerCase().trim();

  if (normalizedName.includes("facebook")) {
    return "https://www.facebook.com/TheKhmersDailyNetwork";
  }
  if (normalizedName.includes("youtube")) {
    return "https://www.youtube.com/@TheKhmerDailyNetworks";
  }
  if (normalizedName.includes("tiktok")) {
    return "https://www.tiktok.com/@thekhmerdailynetwork";
  }
  if (normalizedName.includes("linkedin")) {
    return "https://www.linkedin.com/in/the-khmer-daily-network-a8625238a/";
  }
  if (normalizedName.includes("instagram")) {
    return "https://www.instagram.com/thekhmerdailynetwork/";
  }
  if (normalizedName.includes("twitter") || normalizedName === "x") {
    return "https://x.com/theK_DailyNews";
  }
  if (normalizedName.includes("website") || normalizedName.includes("web")) {
    return "https://www.thekhmerdailynetwork.com";
  }

  return null;
};

interface HeaderSidebarProps {
  topOffset?: number; // Top offset in pixels, default 30px
}

export default function HeaderSidebar({
  topOffset = 30,
}: HeaderSidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreHovered, setIsMoreHovered] = useState(false);
  const [isMoreClicked, setIsMoreClicked] = useState(false);
  const [isAboutUsHovered, setIsAboutUsHovered] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(
    null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aboutUsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to track if categories fetch has been called to prevent duplicate calls in React Strict Mode
  const hasFetchedCategoriesRef = useRef(false);

  // Handle search button click - expand search input
  const handleSearchClick = () => {
    setIsSearchExpanded(true);
    // Focus input after state update
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchExpanded(false);
    }
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSearchExpanded &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsSearchExpanded(false);
        setSearchQuery("");
      }
    };

    if (isSearchExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isSearchExpanded]);

  // Helper function to check if a route is active
  const isActiveRoute = (href: string) => {
    if (!pathname) return false;

    // Normalize paths by removing leading/trailing slashes
    const currentPath = pathname.replace(/^\/|\/$/g, "");
    const routePath = href.replace(/^\/|\/$/g, "");

    // Exact match
    if (currentPath === routePath) return true;

    // Handle category routes - check if current path matches category slug
    // This handles both /news/[id] and /[slug] routes
    if (routePath && currentPath === routePath) return true;

    // Handle /news/[id] routes - extract the id/slug part
    if (currentPath.startsWith("category/")) {
      const categoryPart = currentPath.replace("category/", "");
      if (categoryPart === routePath) return true;
    }

    return false;
  };

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode (development)
    if (hasFetchedCategoriesRef.current) {
      return;
    }

    hasFetchedCategoriesRef.current = true;

    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        // Get first 5 main categories from API (changed from 6 to 5)
        const mainCategories = response.categories.slice(0, 5);

        setCategories(mainCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (aboutUsTimeoutRef.current) {
        clearTimeout(aboutUsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header
      className={`w-full sticky z-50 ${topOffset === 0 ? "top-0" : "top-[30px]"}`}
  >
      <div className="w-full h-[65px] bg-white border-b border-gray-200 rounded-b-[30px] shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Left Side - Logo and Search */}
          <div className="flex items-center gap-4 flex-1">
            {/* Logo */}
            <Link href="/home" className="shrink-0 cursor-pointer">
              <Image
                src={TKDNLogo}
                alt="The Khmer Daily Network Logo"
                width={120}
                height={65}
                className="h-[60px] w-auto object-contain"
                priority
              />
            </Link>

            {/* Search Button/Input - Hidden on mobile */}
            <div className="hidden md:block">
              {!isSearchExpanded ? (
                <button
                  onClick={handleSearchClick}
                  className="flex items-center justify-between h-[40px] rounded-[50px] transition-all duration-200 font-poppins cursor-pointer"
                  style={{
                    backgroundColor: "rgba(29, 34, 41, 0.0314)",
                    fontSize: "12px",
                    color: "#1D2229",
                    width: "350px",
                    paddingLeft: "16px",
                    paddingRight: "1px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                    e.currentTarget.style.boxShadow =
                      "0 0 5px rgba(29, 34, 41, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(29, 34, 41, 0.0314)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
              >
                  <span>Search News "Khmer Daily Network"</span>
                  <div
                    className="flex items-center justify-center rounded-full shrink-0"
                    style={{
                      backgroundColor: "#E34C33",
                      width: "60px",
                      height: "38px",
                    }}
                >
                    <Search size={14} color="white" />
                  </div>
                </button>
              ) : (
                <form
                  onSubmit={handleSearchSubmit}
                  className="w-full"
                  style={{ width: "350px" }}
              >
                  <div
                    className="flex items-center justify-between h-[40px] rounded-[50px] transition-all duration-200 font-poppins"
                    style={{
                      backgroundColor: "white",
                      boxShadow: "0 0 5px rgba(29, 34, 41, 0.3)",
                      fontSize: "12px",
                      color: "#1D2229",
                      width: "350px",
                      paddingLeft: "16px",
                      paddingRight: "1px",
                    }}
                >
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder='Search News "Khmer Daily Network"'
                      className="flex-1 bg-transparent border-none outline-none text-[#1D2229] placeholder-gray-400"
                      style={{ fontSize: "12px" }}
                      onBlur={(e) => {
                        // Don't close if clicking on the search button
                        if (
                          !e.relatedTarget ||
                          !(e.relatedTarget as HTMLElement).closest(
                            'button[type="submit"]',
                          )
                        ) {
                          // Small delay to allow form submission
                          setTimeout(() => {
                            if (!searchQuery.trim()) {
                              setIsSearchExpanded(false);
                            }
                          }, 200);
                        }
                      }}
                    />
                    <button
                      type="submit"
                      className="flex items-center justify-center rounded-full shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                      style={{
                        backgroundColor: "#E34C33",
                        width: "60px",
                        height: "38px",
                      }}
                  >
                      <Search size={14} color="white" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right Side - Navigation – Inter Khmer Looped, text-base */}
          <nav
            className="hidden lg:flex items-center gap-6"
            
        >
            <Link
              href="/latest"
              className={`transition-colors text-base ${
                isActiveRoute("/latest")
                  ? "text-[#E34C33] font-bold"
                  : "text-[#1D2229] hover:text-[#E34C33] font-bold"
              }`}
          >
              LATEST
            </Link>
            <Link
              href="/national"
              className={`transition-colors text-base ${
                isActiveRoute("/national")
                  ? "text-[#E34C33] font-bold"
                  : "text-[#1D2229] hover:text-[#E34C33] font-bold"
              }`}
          >
              NATIONAL
            </Link>
            <Link
              href="/international"
              className={`transition-colors text-base ${
                isActiveRoute("/international")
                  ? "text-[#E34C33] font-bold"
                  : "text-[#1D2229] hover:text-[#E34C33] font-bold"
              }`}
          >
              INTERNATIONAL
            </Link>
            <Link
              href="/video"
              className={`transition-colors text-base ${
                isActiveRoute("/video")
                  ? "text-[#E34C33] font-bold"
                  : "text-[#1D2229] hover:text-[#E34C33] font-bold"
              }`}
              onClick={(e) => {
                e.preventDefault();
                router.push("/video");
              }}
          >
              VIDEO
            </Link>
            <div
              className="relative"
              onMouseEnter={() => {
                // Clear any pending timeout
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                  hoverTimeoutRef.current = null;
                }
                setIsMoreHovered(true);
              }}
              onMouseLeave={() => {
                // Set timeout to close dropdown after 0.2 seconds
                hoverTimeoutRef.current = setTimeout(() => {
                  setIsMoreHovered(false);
                  hoverTimeoutRef.current = null;
                }, 200);
              }}
          >
              <a
                href="#"
                className="flex items-center gap-0 text-[#1D2229] hover:text-[#E34C33] transition-colors font-bold text-base"
            >
                MORE
                <ChevronDown
                  size={16}
                  color="#E34C33"
                  strokeWidth={3.5}
                  className={`transition-transform ${isMoreHovered ? "rotate-180" : ""}`}
                />
              </a>
            </div>
            <div
              className="relative"
              onMouseEnter={() => {
                // Clear any pending timeout
                if (aboutUsTimeoutRef.current) {
                  clearTimeout(aboutUsTimeoutRef.current);
                  aboutUsTimeoutRef.current = null;
                }
                setIsAboutUsHovered(true);
              }}
              onMouseLeave={() => {
                // Set timeout to close dropdown after 0.2 seconds
                aboutUsTimeoutRef.current = setTimeout(() => {
                  setIsAboutUsHovered(false);
                  aboutUsTimeoutRef.current = null;
                }, 200);
              }}
          >
              <a
                href="/about-us"
                className={`flex items-center gap-0 text-base transition-colors ${
                  isActiveRoute("/about-us")
                    ? "text-[#E34C33] font-bold"
                    : "text-[#1D2229] hover:text-[#E34C33] font-bold"
                }`}
            >
                ABOUT US
                <ChevronDown
                  size={16}
                  color="#E34C33"
                  strokeWidth={3.5}
                  className={`transition-transform ${isAboutUsHovered ? "rotate-180" : ""}`}
                />
              </a>

              {/* About Us Dropdown Menu */}
              {isAboutUsHovered && (
                <div
                  className="absolute -right-10 bg-white border border-gray-200 shadow-lg z-40 overflow-hidden w-56"
                  style={{
                    top: "100%",
                    marginTop: "8px",
                    borderRadius: "30px",
                  }}
              >
                  <div className="py-2">
                    <Link
                      href="/about-us"
                      className="block px-4 py-2 text-base transition-colors text-[#E34C33] font-bold hover:bg-gray-50"
                  >
                      About Us
                    </Link>
                    <ul className="border-t border-gray-100">
                      <li>
                        <a
                          href={getSocialMediaLink("Facebook") || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 text-base transition-colors text-gray-600 hover:text-[#E34C33] hover:bg-gray-50"
                      >
                          Facebook
                        </a>
                      </li>
                      <li>
                        <a
                          href={getSocialMediaLink("YouTube") || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 text-base transition-colors text-gray-600 hover:text-[#E34C33] hover:bg-gray-50"
                      >
                          YouTube
                        </a>
                      </li>
                      <li>
                        <a
                          href={getSocialMediaLink("TikTok") || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 text-base transition-colors text-gray-600 hover:text-[#E34C33] hover:bg-gray-50"
                      >
                          TikTok
                        </a>
                      </li>
                      <li>
                        <a
                          href={getSocialMediaLink("X") || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 text-base transition-colors text-gray-600 hover:text-[#E34C33] hover:bg-gray-50"
                      >
                          X
                        </a>
                      </li>
                      <li>
                        <a
                          href={getSocialMediaLink("Instagram") || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 text-base transition-colors text-gray-600 hover:text-[#E34C33] hover:bg-gray-50"
                      >
                          Instagram
                        </a>
                      </li>
                      <li>
                        <a
                          href={getSocialMediaLink("Website") || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 text-base transition-colors text-gray-600 hover:text-[#E34C33] hover:bg-gray-50"
                      >
                          Website
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-[#1D2229] transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
        >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Full Width Categories Dropdown - Desktop (Hover) */}
      <div
        className="hidden lg:block relative w-full"
        onMouseEnter={() => {
          // Clear any pending timeout
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
          }
          setIsMoreHovered(true);
        }}
        onMouseLeave={() => {
          // Set timeout to close dropdown after 0.2 seconds (match About Us)
          hoverTimeoutRef.current = setTimeout(() => {
            setIsMoreHovered(false);
            hoverTimeoutRef.current = null;
          }, 200);
        }}
        style={{ marginTop: "-1px" }}
    >
        {isMoreHovered && (
          <>
            {/* Invisible bridge area to connect button and dropdown - extends upward to eliminate gap */}
            <div
              className="absolute top-0 left-0 w-full pointer-events-auto"
              style={{ height: "20px", marginTop: "-20px" }}
          ></div>
            <div
              className="relative w-full bg-white border border-gray-200 shadow-lg z-40 overflow-hidden"
              style={{ borderRadius: "30px", marginTop: "-8px" }}
          >
              <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {categories.length > 0
                    ? categories.map((category) => {
                        const isVideoCategory =
                          category.name.toLowerCase() === "video";
                        const categorySlug = isVideoCategory
                          ? "/video"
                          : `/${categoryNameToSlug(category.name)}`;
                        const isCategoryActive = isVideoCategory
                          ? isActiveRoute("/video")
                          : isActiveRoute(categorySlug);

                        return (
                          <div key={category.id} className="space-y-3">
                            <Link
                              href={categorySlug}
                              className={`block text-base transition-colors ${
                                isCategoryActive
                                  ? "text-[#E34C33] font-bold"
                                  : "text-[#1D2229] hover:text-[#E34C33] font-bold"
                              }`}
                              onClick={(e) => {
                                if (isVideoCategory) {
                                  e.preventDefault();
                                  router.push("/video");
                                }
                              }}
                          >
                              <span>
                                {category.name}
                              </span>
                            </Link>
                            {category.subcategories &&
                              category.subcategories.length > 0 && (
                                <ul className="space-y-2">
                                  {category.subcategories.map((subcategory) => {
                                    const isVideoSubcategory =
                                      subcategory.name.toLowerCase() ===
                                      "video";
                                    const socialMediaLink = getSocialMediaLink(
                                      subcategory.name,
                                    );
                                    const isAboutUs =
                                      subcategory.name.toLowerCase() ===
                                      "about us";

                                    // If it's a social media link, use the external URL
                                    if (socialMediaLink) {
                                      return (
                                        <li key={subcategory.id}>
                                          <a
                                            href={socialMediaLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block text-base transition-colors text-gray-600 hover:text-[#E34C33]"
                                        >
                                            <span
                                              style={{
                                              }}
                                          >
                                              {subcategory.name}
                                            </span>
                                          </a>
                                        </li>
                                      );
                                    }

                                    // If it's About Us, link to /about-us
                                    if (isAboutUs) {
                                      return (
                                        <li key={subcategory.id}>
                                          <Link
                                            href="/about-us"
                                            className={`block text-base transition-colors ${
                                              isActiveRoute("/about-us")
                                                ? "text-[#E34C33] font-medium"
                                                : "text-gray-600 hover:text-[#E34C33]"
                                            }`}
                                        >
                                            <span
                                              style={{
                                              }}
                                          >
                                              {subcategory.name}
                                            </span>
                                          </Link>
                                        </li>
                                      );
                                    }

                                    // Default behavior for other subcategories
                                    const subcategorySlug = isVideoSubcategory
                                      ? "/video"
                                      : `/${categoryNameToSlug(subcategory.name)}`;
                                    const isSubcategoryActive =
                                      isVideoSubcategory
                                        ? isActiveRoute("/video")
                                        : isActiveRoute(subcategorySlug);

                                    return (
                                      <li key={subcategory.id}>
                                        <Link
                                          href={subcategorySlug}
                                          className={`block text-base transition-colors ${
                                            isSubcategoryActive
                                              ? "text-[#E34C33] font-medium"
                                              : "text-gray-600 hover:text-[#E34C33]"
                                          }`}
                                          onClick={(e) => {
                                            if (isVideoSubcategory) {
                                              e.preventDefault();
                                              router.push("/video");
                                            }
                                          }}
                                      >
                                          <span
                                            style={{
                                            }}
                                        >
                                            {subcategory.name}
                                          </span>
                                        </Link>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                          </div>
                        );
                      })
                    : // Placeholder categories while loading
                      Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="space-y-3">
                          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                          <ul className="space-y-2">
                            {Array.from({ length: 3 }).map((_, subIndex) => (
                              <li key={subIndex}>
                                <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 space-y-4">
            {/* Mobile Search */}
            {!isSearchExpanded ? (
              <button
                onClick={() => {
                  setIsSearchExpanded(true);
                  setTimeout(() => {
                    searchInputRef.current?.focus();
                  }, 0);
                }}
                className="flex items-center justify-between h-[40px] w-full rounded-[50px] transition-all duration-200 font-poppins cursor-pointer"
                style={{
                  backgroundColor: "rgba(29, 34, 41, 0.0314)",
                  fontSize: "12px",
                  color: "#1D2229",
                  paddingLeft: "16px",
                  paddingRight: "1px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                  e.currentTarget.style.boxShadow =
                    "0 0 5px rgba(29, 34, 41, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(29, 34, 41, 0.0314)";
                  e.currentTarget.style.boxShadow = "none";
                }}
            >
                <span>Search News "Khmer Daily Network"</span>
                <div
                  className="flex items-center justify-center rounded-full shrink-0"
                  style={{
                    backgroundColor: "#E34C33",
                    width: "60px",
                    height: "38px",
                  }}
              >
                  <Search size={14} color="white" />
                </div>
              </button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    router.push(
                      `/search?q=${encodeURIComponent(searchQuery.trim())}`,
                    );
                    setSearchQuery("");
                    setIsSearchExpanded(false);
                    setIsMobileMenuOpen(false);
                  }
                }}
                className="w-full"
            >
                <div
                  className="flex items-center justify-between h-[40px] w-full rounded-[50px] transition-all duration-200 font-poppins"
                  style={{
                    backgroundColor: "white",
                    boxShadow: "0 0 5px rgba(29, 34, 41, 0.3)",
                    fontSize: "12px",
                    color: "#1D2229",
                    paddingLeft: "16px",
                    paddingRight: "1px",
                  }}
              >
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Search News "Khmer Daily Network"'
                    className="flex-1 bg-transparent border-none outline-none text-[#1D2229] placeholder-gray-400"
                    style={{ fontSize: "12px" }}
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center rounded-full shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{
                      backgroundColor: "#E34C33",
                      width: "60px",
                      height: "38px",
                    }}
                >
                    <Search size={14} color="white" />
                  </button>
                </div>
              </form>
            )}

            {/* Mobile Navigation Links */}
            <nav className="flex flex-col space-y-3">
              <Link
                href="/latest"
                className={`transition-colors text-base py-2 ${
                  isActiveRoute("/latest")
                    ? "text-[#E34C33] font-medium"
                    : "text-[#1D2229] hover:text-[#E34C33] font-medium"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
            >
                Latest
              </Link>
              <Link
                href="/national"
                className={`transition-colors text-base py-2 ${
                  isActiveRoute("/national")
                    ? "text-[#E34C33] font-medium"
                    : "text-[#1D2229] hover:text-[#E34C33] font-medium"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
            >
                National
              </Link>
              <Link
                href="/international"
                className={`transition-colors text-base py-2 ${
                  isActiveRoute("/international")
                    ? "text-[#E34C33] font-medium"
                    : "text-[#1D2229] hover:text-[#E34C33] font-medium"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
            >
                International
              </Link>
              <Link
                href="/video"
                className={`transition-colors text-base py-2 ${
                  isActiveRoute("/video")
                    ? "text-[#E34C33] font-medium"
                    : "text-[#1D2229] hover:text-[#E34C33] font-medium"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/video");
                  setIsMobileMenuOpen(false);
                }}
            >
                Video
              </Link>
              <Link
                href="/about-us"
                className={`transition-colors text-base py-2 ${
                  isActiveRoute("/about-us")
                    ? "text-[#E34C33] font-medium"
                    : "text-[#1D2229] hover:text-[#E34C33] font-medium"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
            >
                About Us
              </Link>
              <div className="border-t border-gray-200 pt-3">
                <button
                  onClick={() => setIsMoreClicked(!isMoreClicked)}
                  className="text-[#1D2229] hover:text-[#E34C33] transition-colors font-medium text-base py-2 flex items-center gap-1 w-full text-left"
              >
                  More
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${isMoreClicked ? "rotate-180" : ""}`}
                  />
                </button>
                {isMoreClicked && (
                  <div className="pl-4 mt-2 space-y-2">
                    {categories.map((category) => {
                      const isVideoCategory =
                        category.name.toLowerCase() === "video";
                      const categorySlug = isVideoCategory
                        ? "/video"
                        : `/${categoryNameToSlug(category.name)}`;
                      const isCategoryActive = isVideoCategory
                        ? isActiveRoute("/video")
                        : isActiveRoute(categorySlug);

                      return (
                        <div key={category.id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={categorySlug}
                              className={`flex-1 text-base transition-colors ${
                                isCategoryActive
                                  ? "text-[#E34C33] font-bold"
                                  : "text-[#1D2229] hover:text-[#E34C33] font-bold"
                              }`}
                              onClick={(e) => {
                                if (isVideoCategory) {
                                  e.preventDefault();
                                  router.push("/video");
                                }
                                setIsMobileMenuOpen(false);
                                setIsMoreClicked(false);
                              }}
                          >
                              {category.name}
                            </Link>
                            {category.subcategories &&
                              category.subcategories.length > 0 && (
                                <button
                                  onClick={() => {
                                    setExpandedCategoryId(
                                      expandedCategoryId === category.id
                                        ? null
                                        : category.id,
                                    );
                                  }}
                                  className="p-1"
                              >
                                  <ChevronDown
                                    size={12}
                                    className={`transition-transform ${
                                      expandedCategoryId === category.id
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                  />
                                </button>
                              )}
                          </div>
                          {category.subcategories &&
                            category.subcategories.length > 0 &&
                            expandedCategoryId === category.id && (
                              <ul className="pl-4 space-y-1">
                                {category.subcategories.map((subcategory) => {
                                  const isVideoSubcategory =
                                    subcategory.name.toLowerCase() === "video";
                                  const socialMediaLink = getSocialMediaLink(
                                    subcategory.name,
                                  );
                                  const isAboutUs =
                                    subcategory.name.toLowerCase() ===
                                    "about us";

                                  // If it's a social media link, use the external URL
                                  if (socialMediaLink) {
                                    return (
                                      <li key={subcategory.id}>
                                        <a
                                          href={socialMediaLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block text-base transition-colors text-gray-600 hover:text-[#E34C33]"
                                          onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            setIsMoreClicked(false);
                                          }}
                                      >
                                          {subcategory.name}
                                        </a>
                                      </li>
                                    );
                                  }

                                  // If it's About Us, link to /about-us
                                  if (isAboutUs) {
                                    return (
                                      <li key={subcategory.id}>
                                        <Link
                                          href="/about-us"
                                          className={`block text-base transition-colors ${
                                            isActiveRoute("/about-us")
                                              ? "text-[#E34C33] font-medium"
                                              : "text-gray-600 hover:text-[#E34C33]"
                                          }`}
                                          onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            setIsMoreClicked(false);
                                          }}
                                      >
                                          {subcategory.name}
                                        </Link>
                                      </li>
                                    );
                                  }

                                  // Default behavior for other subcategories
                                  const subcategorySlug = isVideoSubcategory
                                    ? "/video"
                                    : `/${categoryNameToSlug(subcategory.name)}`;
                                  const isSubcategoryActive = isVideoSubcategory
                                    ? isActiveRoute("/video")
                                    : isActiveRoute(subcategorySlug);

                                  return (
                                    <li key={subcategory.id}>
                                      <Link
                                        href={subcategorySlug}
                                        className={`block text-base transition-colors ${
                                          isSubcategoryActive
                                            ? "text-[#E34C33] font-medium"
                                            : "text-gray-600 hover:text-[#E34C33]"
                                        }`}
                                        onClick={(e) => {
                                          if (isVideoSubcategory) {
                                            e.preventDefault();
                                            router.push("/video");
                                          }
                                          setIsMobileMenuOpen(false);
                                          setIsMoreClicked(false);
                                        }}
                                    >
                                        {subcategory.name}
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
