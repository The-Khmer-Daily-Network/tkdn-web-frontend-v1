"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import TKDNLogo from "@/assets/TKDN_Logo/TKDN_Logo_NoneBack.png";
import { getVideoShorts } from "@/services/videosShort";
import type { VideoShort } from "@/types/videosShort";

function formatShortDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "Play";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest > 0 ? `${minutes}m ${rest}s` : `${minutes}m`;
}

export default function HomeShortsFeature() {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [shorts, setShorts] = useState<VideoShort[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const load = async () => {
      try {
        const response = await getVideoShorts();
        setShorts(response.data ?? []);
      } catch (error) {
        console.error("Error fetching shorts:", error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const scrollByCard = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector("[data-short-card]");
    const amount = card instanceof HTMLElement ? card.offsetWidth + 16 : 220;
    el.scrollBy({ left: amount * direction, behavior: "smooth" });
  };

  const openShort = (id: number) => {
    router.push(`/shorts?id=${id}`);
  };

  if (loading) {
    return (
      <section className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-black py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-7 w-24 mb-5 animate-pulse rounded bg-white/15" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={`short-skel-${i}`}
                className="h-[360px] w-[200px] shrink-0 animate-pulse rounded-sm bg-white/10"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (shorts.length === 0) return null;

  return (
    <section className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-black py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-white">Shorts</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-full border border-white/80 text-white hover:bg-white/10 transition-colors"
              aria-label="Scroll shorts left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-full border border-white/80 text-white hover:bg-white/10 transition-colors"
              aria-label="Scroll shorts right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {shorts.map((item) => (
            <button
              key={item.id}
              type="button"
              data-short-card
              onClick={() => openShort(item.id)}
              className="relative h-[360px] w-[200px] shrink-0 overflow-hidden rounded-2xl bg-neutral-800 text-left cursor-pointer sm:h-[400px] sm:w-[220px]"
            >
              {item.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.cover}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-neutral-800" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />

              <Image
                src={TKDNLogo}
                alt="TKDN"
                width={48}
                height={20}
                className="absolute top-3 left-3 h-4 w-auto object-contain"
                unoptimized
              />

              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="text-white text-sm font-medium leading-snug line-clamp-3 mb-3">
                  {item.title}
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-black">
                  <Play size={11} fill="currentColor" />
                  {formatShortDuration(item.duration_seconds)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
