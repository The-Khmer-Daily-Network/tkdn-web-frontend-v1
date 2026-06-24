"use client";

import { useEffect, useState } from "react";
import { formatDateShort, getRelativeTime } from "@/utils/newsDates";

/**
 * Shows publish date in the visitor's local timezone (client-only).
 * Relative time ("5 minutes ago") updates every minute.
 */
export default function NewsPublishedMeta({
  publishedAt,
  author,
}: {
  publishedAt: string;
  author?: string | null;
}) {
  const [formattedDate, setFormattedDate] = useState("");
  const [relativeTime, setRelativeTime] = useState(() =>
    getRelativeTime(publishedAt),
  );

  useEffect(() => {
    const refresh = () => {
      setFormattedDate(formatDateShort(publishedAt));
      setRelativeTime(getRelativeTime(publishedAt));
    };

    refresh();
    const intervalId = setInterval(refresh, 60_000);
    return () => clearInterval(intervalId);
  }, [publishedAt]);

  if (!formattedDate && !relativeTime && !author) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {formattedDate && (
        <span className="text-sm text-gray-600">{formattedDate}</span>
      )}
      {relativeTime && (
        <span className="text-xs text-gray-500">• {relativeTime}</span>
      )}
      {author && <span className="text-sm text-gray-600">• {author}</span>}
    </div>
  );
}
