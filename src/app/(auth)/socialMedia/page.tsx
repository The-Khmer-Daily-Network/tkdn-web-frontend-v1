"use client";

import ComingSoon from "@/components/admin/ComingSoon";
import { Share2 } from "lucide-react";

export default function SocialMedia() {
  return (
    <div>
      <ComingSoon
        title="Social Media Analytics"
        description="Track your social media engagement, monitor post performance, and analyze audience interactions across all platforms."
        icon={Share2}
      />
    </div>
  );
}
