"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import SidebareAdmin from "@/features/admin/sidebare";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isUserSME, loading, logout } = useAuth();
  const roleNormalized = user?.role?.trim().toUpperCase();
  const isAdminOnly = roleNormalized === "ADMIN";
  const adminAllowedRoutes = [
    "/dashboard",
    "/web",
    "/socialMedia",
    "/statistics",
    "/guidelines",
    "/videoManagement",
    "/articleManagement",
    "/activityLog",
  ];
  const isAllowedAdminRoute =
    !!pathname && adminAllowedRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login with the current path as redirect parameter
      const redirectPath = encodeURIComponent(pathname || "/dashboard");
      router.push(`/login?redirect=${redirectPath}`);
    }
  }, [isAuthenticated, loading, pathname, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#273C8F] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render the layout if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // "Admin" role should only access specific pages.
  if (isAdminOnly && !isAllowedAdminRoute) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Access denied</h1>
          <p className="mt-2 text-sm text-gray-600">
            This account can only access Analytics, Notification, Article
            Management, and Video Management.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
              Go to Analytics
            </button>
            <button
              onClick={() => {
                logout();
                const redirectPath = encodeURIComponent(pathname || "/dashboard");
                router.push(`/login?redirect=${redirectPath}`);
              }}
              className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin-only area: show a friendly access denied screen for non-admin users.
  // (In this codebase, `isUserSME` is the closest thing to an admin role.)
  if (!isUserSME) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Access denied</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your account does not have permission to access the admin dashboard.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => router.push("/")}
              className="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
              Go home
            </button>
            <button
              onClick={() => {
                logout();
                const redirectPath = encodeURIComponent(pathname || "/dashboard");
                router.push(`/login?redirect=${redirectPath}`);
              }}
              className="cursor-pointer rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SidebareAdmin />
      {/* Main Content Area */}
      <main className="ml-[280px] min-h-screen bg-gray-50">
        {/* Container with max-width 1440px, min-width 1000px, centered */}
        <div
          className="mx-auto min-h-screen bg-gray-50"
          style={{ maxWidth: "1440px", width: "clamp(1000px, 100%, 1440px)" }}
      >
          <div className="">{children}</div>
        </div>
      </main>
    </div>
  );
}
