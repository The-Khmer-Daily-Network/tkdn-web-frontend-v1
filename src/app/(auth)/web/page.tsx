"use client";

import ComingSoon from "@/components/admin/ComingSoon";
import { Globe } from "lucide-react";

export default function WebAnalytics() {
  return (
    <div>
      <ComingSoon
        title="Web Analytics"
        description="Monitor your website's performance, track visitor behavior, and analyze web traffic patterns to optimize your online presence."
        icon={Globe}
      />
    </div>
  );
}
