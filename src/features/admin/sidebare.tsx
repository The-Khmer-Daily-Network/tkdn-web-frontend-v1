"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserPassword } from "@/services/auth";
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
  const { user, isUserSME, logout, refreshUser } = useAuth();
  const roleNormalized = user?.role?.trim().toUpperCase();
  const isAdminOnly = roleNormalized === "ADMIN";
  const displayName = getProfileDisplayName(user);
  const initials = getInitialsFromName(displayName);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const openEditProfileModal = () => {
    setProfileError(null);
    setProfileSuccess(null);
    setNewPassword("");
    setConfirmPassword("");
    setIsProfileModalOpen(true);
  };

  const closeEditProfileModal = () => {
    if (profileSaving) return;
    setIsProfileModalOpen(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setProfileError("No active user found.");
      return;
    }
    if (!newPassword.trim()) {
      setProfileError("Password is required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setProfileError("Password confirmation does not match.");
      return;
    }

    try {
      setProfileSaving(true);
      setProfileError(null);
      setProfileSuccess(null);
      await updateUserPassword(user.id, newPassword.trim());
      refreshUser();
      setProfileSuccess("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setProfileError(
        error instanceof Error ? error.message : "Failed to update password.",
      );
    } finally {
      setProfileSaving(false);
    }
  };

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
      ? "block ml-9 px-3 py-1.5 text-[14px] rounded-md transition-colors"
      : "block w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors";

    if (disabled) {
      return `${baseClasses} text-gray-400 cursor-not-allowed opacity-60`;
    }

    if (active) {
      return isSubItem
        ? `${baseClasses} bg-gray-200 text-[#1f1f1f] font-medium`
        : `${baseClasses} bg-gray-200 text-[#1f1f1f] font-medium`;
    }
    return `${baseClasses} text-[#6b6b6b] hover:bg-gray-200/70 hover:text-[#1f1f1f]`;
  };

  const iconClass = "h-5 w-5 shrink-0";
  const renderMenuIcon = (key: string) => {
    switch (key) {
      case "analytics":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 20h16M7 20V10m5 10V6m5 14v-8" />
          </svg>
        );
      case "article":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h8M8 12h8M8 17h5" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
          </svg>
        );
      case "video":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="5" width="14" height="14" rx="2" strokeWidth={1.8} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 9l4 3-4 3V9zM18 10l3-2v8l-3-2v-4z" />
          </svg>
        );
      case "notification":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0h6z" />
          </svg>
        );
      case "media":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth={1.8} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 13l2.5-2.5L15 15l2-2 3 3M8 9h.01" />
          </svg>
        );
      case "activity":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12h4l2-5 4 10 2-5h6" />
          </svg>
        );
      case "users":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 19v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1m13-8a3 3 0 110-6 3 3 0 010 6zm6 8v-1a4 4 0 00-3-3.87" />
          </svg>
        );
      case "category":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        );
      case "ad":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 15V9a2 2 0 012-2h8l6-3v16l-6-3H6a2 2 0 01-2-2zM8 12h3" />
          </svg>
        );
      case "team":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-8a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
        );
      case "partner":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h10v10H7zM3 3h4v4H3zM17 3h4v4h-4zM3 17h4v4H3zM17 17h4v4h-4z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-[#f7f7f7] border-r border-gray-200 flex flex-col">
      {/* Brand */}
      <div className="min-h-16 px-5 py-3 flex items-center">
        <p className="text-[18px] font-semibold leading-snug text-[#1f1f1f]">
          The Khmer Daily Network
        </p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <ul className="space-y-1">
          {isAdminOnly ? (
            <>
              <li>
                <button
                  onClick={() => setDashboardOpen(!dashboardOpen)}
                  className="cursor-pointer w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left text-[#6b6b6b] hover:bg-gray-200/70 hover:text-[#1f1f1f] rounded-md transition-colors"
              >
                  <span className="flex items-center gap-3">
                    {renderMenuIcon("analytics")}
                    <span>Analytics</span>
                  </span>
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
              <li>
                <Link
                  href="/articleManagement"
                  className={getLinkClasses("/articleManagement")}
              >
                  {renderMenuIcon("article")}
                  <span>Article Management</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/videoManagement"
                  className={getLinkClasses("/videoManagement")}
              >
                  {renderMenuIcon("video")}
                  <span>Video Management</span>
                </Link>
              </li>
            </>
          ) : (
            <>
          {/* Dashboard with Dropdown */}
          <li>
            <button
              onClick={() => setDashboardOpen(!dashboardOpen)}
              className="cursor-pointer w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left text-[#6b6b6b] hover:bg-gray-200/70 hover:text-[#1f1f1f] rounded-md transition-colors"
          >
              <span className="flex items-center gap-3">
                {renderMenuIcon("analytics")}
                <span>Analytics</span>
              </span>
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
              {renderMenuIcon("article")}
              <span>Article Management</span>
            </Link>
          </li>

          {/* Video - No Dropdown */}
          <li>
            <Link
              href="/videoManagement"
              className={getLinkClasses("/videoManagement")}
          >
              {renderMenuIcon("video")}
              <span>Video Management</span>
            </Link>
          </li>

          {/* Media Library with Dropdown */}
          <li>
            <button
              onClick={() => setMediaLibraryOpen(!mediaLibraryOpen)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left text-[#6b6b6b] hover:bg-gray-200/70 hover:text-[#1f1f1f] rounded-md transition-colors"
          >
              <span className="flex items-center gap-3">
                {renderMenuIcon("media")}
                <span>Media Library</span>
              </span>
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
                {renderMenuIcon("activity")}
                <span>Activity Log</span>
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
                {renderMenuIcon("users")}
                <span>User Management</span>
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
                {renderMenuIcon("category")}
                <span>Categories Management</span>
              </Link>
            ) : (
              <>
                <div
                  className={getLinkClasses("/categoryManagement", false, true)}
              >
                  {renderMenuIcon("category")}
                  <span>Categories Management</span>
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
                {renderMenuIcon("team")}
                <span>Newsroom Team</span>
              </Link>
            ) : (
              <>
                <div className={getLinkClasses("/newsroomTeam", false, true)}>
                  {renderMenuIcon("team")}
                  <span>Newsroom Team</span>
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
                {renderMenuIcon("partner")}
                <span>Partners</span>
              </Link>
            ) : (
              <>
                <div className={getLinkClasses("/ourPartner", false, true)}>
                  {renderMenuIcon("partner")}
                  <span>Partners</span>
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
            </>
          )}
        </ul>
      </nav>

      {/* Profile at Bottom (match v2 flow) */}
      <div className="border-t border-gray-200 p-4 relative">
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
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={profileOpen ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"}
            />
          </svg>
        </button>

        {profileOpen && (
          <div className="absolute left-4 right-4 bottom-full mb-2 space-y-1 rounded-md border border-gray-200 bg-white p-1 shadow-md">
            <button
              onClick={() => {
                setProfileOpen(false);
                openEditProfileModal();
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
              onClick={closeEditProfileModal}
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
                </div>
                <form onSubmit={handlePasswordUpdate} className="px-5 py-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Gmail
                    </label>
                    <input
                      type="text"
                      value={user?.gmail || ""}
                      disabled
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={user?.username || ""}
                      disabled
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={user?.first_name || ""}
                        disabled
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={user?.last_name || ""}
                        disabled
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Nickname
                    </label>
                    <input
                      type="text"
                      value={user?.nickname || displayName}
                      disabled
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      value={user?.role || ""}
                      disabled
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900"
                      disabled={profileSaving}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900"
                      disabled={profileSaving}
                    />
                  </div>
                  {profileError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {profileError}
                    </p>
                  )}
                  {profileSuccess && (
                    <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                      {profileSuccess}
                    </p>
                  )}
                  <div className="pt-2 border-t border-gray-200 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeEditProfileModal}
                      className="cursor-pointer px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                      disabled={profileSaving}
                  >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="cursor-pointer px-4 py-2 text-sm rounded-md bg-[#273C8F] text-white hover:bg-[#1f3072] disabled:opacity-60"
                      disabled={profileSaving}
                  >
                      {profileSaving ? "Saving..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>,
          document.body,
        )}
    </aside>
  );
}
