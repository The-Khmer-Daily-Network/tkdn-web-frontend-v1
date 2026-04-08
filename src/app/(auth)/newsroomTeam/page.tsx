"use client";

import Newsroom from "@/features/admin/newsroom";
import SMEProtectedRoute from "@/components/SMEProtectedRoute";

export default function NewsroomTeamPage() {
  return (
    <SMEProtectedRoute>
      <div>
        <Newsroom />
      </div>
    </SMEProtectedRoute>
  );
}
