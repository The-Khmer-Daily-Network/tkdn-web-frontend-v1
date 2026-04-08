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
  const { isAuthenticated, loading } = useAuth();

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

  return (
    <div className="min-h-screen bg-white">
      <SidebareAdmin />
      {/* Main Content Area */}
      <main className="ml-[250px] min-h-screen bg-gray-50">
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
