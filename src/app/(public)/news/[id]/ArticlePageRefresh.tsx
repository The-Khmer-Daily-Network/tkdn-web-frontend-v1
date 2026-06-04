"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getNewsById } from "@/services/news";

/**
 * Compares live API data with the server-rendered snapshot; refreshes the RSC tree when the article changed.
 */
export default function ArticlePageRefresh({
  articleId,
  serverUpdatedAt,
}: {
  articleId: number;
  serverUpdatedAt: string;
}) {
  const router = useRouter();
  const refreshedRef = useRef(false);

  useEffect(() => {
    if (refreshedRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const response = await getNewsById(articleId);
        if (cancelled || !response.success || !response.data) return;

        const apiUpdatedAt = response.data.updated_at || "";
        if (apiUpdatedAt && apiUpdatedAt !== serverUpdatedAt) {
          refreshedRef.current = true;
          router.refresh();
        }
      } catch {
        // Non-blocking: stale page still renders from server snapshot.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [articleId, serverUpdatedAt, router]);

  return null;
}
