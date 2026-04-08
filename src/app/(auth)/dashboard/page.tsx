"use client";

import ComingSoon from "@/components/admin/ComingSoon";
import { BarChart3 } from "lucide-react";

export default function AnalyticsDashboard() {
  return (
    <div>
      <ComingSoon
        title="Analytics Dashboard"
        description="Comprehensive analytics and insights for your content performance. Track metrics, view reports, and make data-driven decisions."
        icon={BarChart3}
      />
    </div>
  );
}
