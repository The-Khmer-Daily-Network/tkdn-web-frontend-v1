"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ShortsPlayer from "@/features/userFeature/shortsPlayer";

function ShortsPageInner() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("id");
  const parsed = rawId ? Number(rawId) : null;
  const initialId = parsed != null && Number.isFinite(parsed) ? parsed : null;

  return <ShortsPlayer initialId={initialId} />;
}

export default function ShortsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f]">
          <div className="h-[min(78vh,720px)] aspect-[9/16] max-w-full animate-pulse rounded-3xl bg-white/10" />
        </div>
      }
    >
      <ShortsPageInner />
    </Suspense>
  );
}
