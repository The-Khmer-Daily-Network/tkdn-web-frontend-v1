"use client";

import Publishers from "@/features/admin/publishers";
import SMEProtectedRoute from "@/components/SMEProtectedRoute";

export default function PublishersPage() {
  return (
    <SMEProtectedRoute>
      <div>
        <Publishers />
      </div>
    </SMEProtectedRoute>
  );
}
