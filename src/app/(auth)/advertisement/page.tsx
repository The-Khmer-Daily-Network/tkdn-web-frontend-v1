"use client";

import Advertisement from "@/features/admin/advertisement";
import SMEProtectedRoute from "@/components/SMEProtectedRoute";

export default function AdvertisementPage() {
  return (
    <SMEProtectedRoute>
      <div>
        <Advertisement />
      </div>
    </SMEProtectedRoute>
  );
}
