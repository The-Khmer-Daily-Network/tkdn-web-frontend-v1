"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface SMEProtectedRouteProps {
  children: React.ReactNode;
}

export default function SMEProtectedRoute({
  children,
}: SMEProtectedRouteProps) {
  const router = useRouter();
  const { isUserSME, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated && !isUserSME) {
      // Redirect to dashboard if user is not SME
      router.push("/dashboard");
    }
  }, [isUserSME, loading, isAuthenticated, router]);

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

  // Don't render content if user is not SME (redirect will happen)
  if (!isUserSME) {
    return null;
  }

  return <>{children}</>;
}
