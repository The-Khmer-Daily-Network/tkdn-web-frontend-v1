"use client";

import OurPartner from "@/features/admin/ourPartner";
import SMEProtectedRoute from "@/components/SMEProtectedRoute";

export default function OurPartnersPage() {
  return (
    <SMEProtectedRoute>
      <div>
        <OurPartner />
      </div>
    </SMEProtectedRoute>
  );
}
