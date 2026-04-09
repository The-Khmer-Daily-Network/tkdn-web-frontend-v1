"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/assets/TKDN_Logo/TKDN_Logo_Rectangle.jpg";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/types/auth";

function getProfileDisplayName(user: User | null): string {
  if (!user) return "Guest";
  const first = user.first_name?.trim();
  const last = user.last_name?.trim();
  if (first || last) {
    return [first, last].filter(Boolean).join(" ");
  }
  const u = user.username?.trim();
  if (u?.includes(" ")) return u;
  return u || "User";
}

function getInitialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function SidebareAdmin() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserSME, logout } = useAuth();
  const displayName = getProfileDisplayName(user);
  const initials = getInitialsFromName(displayName);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Auto-open dropdowns that contain the active route
  useEffect(() => {
    // Check if current route is under Media Library
    if (
      pathname?.includes("/covers") ||
      pathname?.includes("/content-images") ||
      pathname?.includes("/content-videos")
    ) {
      setMediaLibraryOpen(true);
    }
    // Check if current route is under Analytics
    if (
      pathname?.includes("/dashboard") ||
      pathname?.includes("/web") ||
      pathname?.includes("/socialMedia") ||
      pathname?.includes("/statistics")
    ) {
      setDashboardOpen(true);
    }
  }, [pathname]);

  // Helper function to check if a route is active
  const isActive = (path: string) => {
    if (!pathname) return false;
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  // Helper function to get link classes
  const getLinkClasses = (
    path: string,
    isSubItem: boolean = false,
    disabled: boolean = false,
  ) => {
    const active = isActive(path);
    const baseClasses = isSubItem
      ? "block px-4 py-2 text-sm rounded-md transition-colors"
      : "block px-4 py-2 rounded-md transition-colors";

    if (disabled) {
      return `${baseClasses} text-gray-400 cursor-not-allowed opacity-60`;
    }

    if (active) {
      return `${baseClasses} bg-[#273C8F] text-white`;
    }
    return `${baseClasses} text-[#273C8F] hover:bg-gray-100`;
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[250px] bg-white border-r border-gray-200 flex flex-col">
      {/* Logo Section */}
      <div className=" border-b border-gray-200 flex items-center justify-center">
        <Image
          src={Logo}
          alt="The Khmer Daily Network Logo"
          width={230}
          height={90}
          className="object-contain w-[230px] h-[110px]"
          priority
        />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {/* Dashboard with Dropdown */}
          <li>
            <button
              onClick={() => setDashboardOpen(!dashboardOpen)}
              className="cursor-pointer w-full flex items-center justify-between px-4 py-2 text-left text-[#273C8F] hover:bg-gray-100 rounded-md transition-colors"
            >
              <span>Analytics</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  dashboardOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {dashboardOpen && (
              <ul className="ml-4 mt-2 space-y-1">
                <li>
                  <Link
                    href="/dashboard"
                    className={getLinkClasses("/dashboard", true)}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/web" className={getLinkClasses("/web", true)}>
                    Web
                  </Link>
                </li>
                <li>
                  <Link
                    href="/socialMedia"
                    className={getLinkClasses("/socialMedia", true)}
                  >
                    Social Media
                  </Link>
                </li>
                <li>
                  <Link
                    href="/statistics"
                    className={getLinkClasses("/statistics", true)}
                  >
                    Statistics
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Article - No Dropdown */}
          <li>
            <Link
              href="/articleManagement"
              className={getLinkClasses("/articleManagement")}
            >
              Article Management
            </Link>
          </li>

          {/* Video - No Dropdown */}
          <li>
            <Link
              href="/videoManagement"
              className={getLinkClasses("/videoManagement")}
            >
              Video Management
            </Link>
          </li>

          {/* Guidelines (UI only for now) */}
          <li>
            <Link href="/guidelines" className={getLinkClasses("/guidelines")}>
              Guidelines
            </Link>
          </li>

          {/* Media Library with Dropdown */}
          <li>
            <button
              onClick={() => setMediaLibraryOpen(!mediaLibraryOpen)}
              className="w-full flex items-center justify-between px-4 py-2 text-left text-[#273C8F] hover:bg-gray-100 rounded-md transition-colors"
            >
              <span>Media Library</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  mediaLibraryOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {mediaLibraryOpen && (
              <ul className="ml-4 mt-2 space-y-1">
                <li>
                  <Link
                    href="/covers"
                    className={getLinkClasses("/covers", true)}
                  >
                    Covers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contentImages"
                    className={getLinkClasses("/contentImages", true)}
                  >
                    Content Images
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contentVideos"
                    className={getLinkClasses("/contentVideos", true)}
                  >
                    Content Videos
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Activity Log - SME Only (UI only for now) */}
          {isUserSME && (
            <li>
              <Link
                href="/activityLog"
                className={getLinkClasses("/activityLog")}
              >
                Activity Log
              </Link>
            </li>
          )}

          {/* User Management - SME Only (UI only for now) */}
          {isUserSME && (
            <li>
              <Link
                href="/userManagement"
                className={getLinkClasses("/userManagement")}
              >
                User Management
              </Link>
            </li>
          )}

          {/* Category - No Dropdown - SME Only */}
          <li className="relative group">
            {isUserSME ? (
              <Link
                href="/categoryManagement"
                className={getLinkClasses("/categoryManagement")}
              >
                Categories Management
              </Link>
            ) : (
              <>
                <div
                  className={getLinkClasses("/categoryManagement", false, true)}
                >
                  Categories Management
                </div>
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                  <span className="text-sm">Your role not allow</span>
                </div>
              </>
            )}
          </li>

          {/* Publisher - No Dropdown - SME Only */}
          <li className="relative group">
            {isUserSME ? (
              <Link
                href="/publishers"
                className={getLinkClasses("/publishers")}
              >
                Publishers
              </Link>
            ) : (
              <>
                <div className={getLinkClasses("/publishers", false, true)}>
                  Publishers
                </div>
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                  <span className="text-sm">Your role not allow</span>
                </div>
              </>
            )}
          </li>

          {/* Advertisement - No Dropdown - SME Only */}
          <li className="relative group">
            {isUserSME ? (
              <Link
                href="/advertisement"
                className={getLinkClasses("/advertisement")}
              >
                Advertisement
              </Link>
            ) : (
              <>
                <div className={getLinkClasses("/advertisement", false, true)}>
                  Advertisement
                </div>
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                  <span className="text-sm">Your role not allow</span>
                </div>
              </>
            )}
          </li>

          {/* Newsroom Team - No Dropdown - SME Only */}
          <li className="relative group">
            {isUserSME ? (
              <Link
                href="/newsroomTeam"
                className={getLinkClasses("/newsroomTeam")}
              >
                Newsroom Team
              </Link>
            ) : (
              <>
                <div className={getLinkClasses("/newsroomTeam", false, true)}>
                  Newsroom Team
                </div>
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                  <span className="text-sm">Your role not allow</span>
                </div>
              </>
            )}
          </li>

          {/* Partners - No Dropdown - SME Only */}
          <li className="relative group">
            {isUserSME ? (
              <Link
                href="/ourPartner"
                className={getLinkClasses("/ourPartner")}
              >
                Partners
              </Link>
            ) : (
              <>
                <div className={getLinkClasses("/ourPartner", false, true)}>
                  Partners
                </div>
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                  <span className="text-sm">Your role not allow</span>
                </div>
              </>
            )}
          </li>
        </ul>
      </nav>

      {/* Profile at Bottom (match v2 flow) */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={() => setProfileOpen((prev) => !prev)}
          className="cursor-pointer w-full flex items-center justify-between gap-2 px-3 py-2 text-left rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#273C8F] ring-2 ring-white">
              {user?.profile_image_url ? (
                <Image
                  src={user.profile_image_url}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 object-cover"
                />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center text-xs font-semibold text-white"
                  aria-hidden
                >
                  {initials}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1D2229] truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.gmail || ""}</p>
            </div>
          </div>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${
              profileOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {profileOpen && (
          <div className="mt-2 space-y-1">
            <button
              onClick={() => {
                setProfileOpen(false);
                setIsProfileModalOpen(true);
              }}
              className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-sm text-[#273C8F] hover:bg-blue-50 rounded-md transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A10.954 10.954 0 0112 15c2.5 0 4.847.815 6.879 2.196M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Edit Profile</span>
            </button>
            <button
              onClick={() => {
                setProfileOpen(false);
                logout();
                router.push("/login");
              }}
              className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {isMounted &&
        isProfileModalOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
              style={{ zIndex: 10000 }}
              onClick={() => setIsProfileModalOpen(false)}
            />
            <div
              className="fixed inset-0 flex items-center justify-center p-4"
              style={{ zIndex: 10010 }}
            >
              <div
                className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-5 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-[#1D2229]">
                    Edit Profile
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    This UI is ready, but the API is not implemented yet.
                  </p>
                </div>
                <div className="px-5 py-4">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Password change endpoint is not available in TKDN backend
                    yet. When it’s ready, we’ll wire this screen to it.
                  </div>
                </div>
                <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
                  <button
                    onClick={() => setIsProfileModalOpen(false)}
                    className="cursor-pointer px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </aside>
  );
}
