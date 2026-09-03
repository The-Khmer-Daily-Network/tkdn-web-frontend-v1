"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Heart,
  Maximize,
  Pause,
  Play,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  getVideoShorts,
  incrementVideoShortLike,
  incrementVideoShortView,
  youtubeEmbedUrl,
  youtubeIdFromUrl,
} from "@/services/videosShort";
import type { VideoShort } from "@/types/videosShort";

function hasSessionFlag(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setSessionFlag(key: string) {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // ignore
  }
}

function sendYoutubeCommand(iframe: HTMLIFrameElement | null, func: string) {
  iframe?.contentWindow?.postMessage(
    JSON.stringify({ event: "command", func, args: [] }),
    "*",
  );
}

export default function ShortsPlayer({ initialId = null }: ShortsPlayerProps) {
  const router = useRouter();
  const [shorts, setShorts] = useState<VideoShort[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [shareNote, setShareNote] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const youtubeRef = useRef<HTMLIFrameElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const wheelLockRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const viewedRef = useRef<Set<number>>(new Set());
  const hasFetchedRef = useRef(false);

  const current = shorts[index] ?? null;

  useEffect(() => {
    try {
      const liked = new Set<number>();
      for (let i = 0; i < sessionStorage.length; i += 1) {
        const key = sessionStorage.key(i);
        if (key?.startsWith("short-liked-") && sessionStorage.getItem(key) === "1") {
          const id = Number(key.replace("short-liked-", ""));
          if (Number.isFinite(id)) liked.add(id);
        }
      }
      if (liked.size > 0) setLikedIds(liked);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const load = async () => {
      try {
        setLoading(true);
        const response = await getVideoShorts();
        const data = response.data ?? [];
        setShorts(data);
        if (initialId != null) {
          const found = data.findIndex((item) => item.id === initialId);
          if (found >= 0) setIndex(found);
        }
      } catch (error) {
        console.error("Error fetching shorts:", error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [initialId]);

  const markViewed = useCallback(async (item: VideoShort) => {
    if (viewedRef.current.has(item.id) || hasSessionFlag(`short-viewed-${item.id}`)) {
      return;
    }
    viewedRef.current.add(item.id);
    setSessionFlag(`short-viewed-${item.id}`);
    try {
      const updated = await incrementVideoShortView(item.id);
      setShorts((prev) => prev.map((s) => (s.id === item.id ? updated : s)));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!current) return;
    setProgress(0);
    setPaused(false);
    setMuted(true);
    void markViewed(current);
  }, [current, markViewed]);

  const goTo = useCallback(
    (nextIndex: number) => {
      if (shorts.length === 0) return;
      const clamped = Math.max(0, Math.min(shorts.length - 1, nextIndex));
      if (clamped === index) return;
      setIndex(clamped);
    },
    [index, shorts.length],
  );

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        goNext();
      } else if (event.key === " ") {
        event.preventDefault();
        setPaused((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const onWheel = (event: React.WheelEvent) => {
    if (Math.abs(event.deltaY) < 20 || wheelLockRef.current) return;
    wheelLockRef.current = true;
    if (event.deltaY > 0) goNext();
    else goPrev();
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 650);
  };

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    const startY = touchStartYRef.current;
    touchStartYRef.current = null;
    if (startY == null) return;
    const endY = event.changedTouches[0]?.clientY;
    if (endY == null) return;
    const delta = startY - endY;
    if (Math.abs(delta) < 48) return;
    if (delta > 0) goNext();
    else goPrev();
  };

  const togglePause = () => {
    setPaused((value) => {
      const next = !value;
      const video = videoRef.current;
      if (video) {
        if (next) video.pause();
        else void video.play();
      }
      sendYoutubeCommand(youtubeRef.current, next ? "pauseVideo" : "playVideo");
      return next;
    });
  };

  const toggleMute = () => {
    setMuted((value) => {
      const next = !value;
      if (videoRef.current) videoRef.current.muted = next;
      sendYoutubeCommand(youtubeRef.current, next ? "mute" : "unMute");
      if (!next) sendYoutubeCommand(youtubeRef.current, "playVideo");
      return next;
    });
  };

  const handleLike = async () => {
    if (!current) return;
    const key = `short-liked-${current.id}`;
    if (hasSessionFlag(key) || likedIds.has(current.id)) return;
    setLikedIds((prev) => new Set(prev).add(current.id));
    setSessionFlag(key);
    try {
      const updated = await incrementVideoShortLike(current.id);
      setShorts((prev) => prev.map((s) => (s.id === current.id ? updated : s)));
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    if (!current || typeof window === "undefined") return;
    const url = `${window.location.origin}/shorts?id=${current.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: current.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNote("Link copied");
        window.setTimeout(() => setShareNote(null), 1600);
      }
    } catch {
      // ignore cancel
    }
  };

  const enterFullscreen = () => {
    const el = frameRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void el.requestFullscreen();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f]">
        <div className="h-[min(82vh,760px)] aspect-[9/16] max-w-full animate-pulse rounded-3xl bg-white/10" />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f]">
        <p className="text-sm text-white/70">No shorts available</p>
      </div>
    );
  }

  const youtubeId = youtubeIdFromUrl(current.youtube_url);
  const embed = youtubeEmbedUrl(current.youtube_url);
  const liked = likedIds.has(current.id);
  const canPrev = index > 0;
  const canNext = index < shorts.length - 1;
  const isYoutube = current.source_type === "youtube" && Boolean(embed && youtubeId);
  const origin =
    typeof window !== "undefined" ? encodeURIComponent(window.location.origin) : "";

  return (
    <div
      className="relative min-h-screen bg-[#0f0f0f] text-white"
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) router.back();
          else router.push("/");
        }}
        className="cursor-pointer absolute top-5 left-5 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="Back"
      >
        <ChevronLeft size={24} />
      </button>

      <div className="mx-auto flex min-h-screen items-center justify-center gap-5 px-4 py-8">
        <div
          ref={frameRef}
          className="relative h-[min(86vh,820px)] aspect-[9/16] max-w-[calc(100vw-7rem)] overflow-hidden rounded-3xl bg-black"
        >
          {isYoutube ? (
            <div className="absolute inset-0 overflow-hidden bg-black">
              {current.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.cover}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <iframe
                ref={youtubeRef}
                key={current.id}
                src={`${embed}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0&loop=1&playlist=${youtubeId}&iv_load_policy=3&cc_load_policy=0&disablekb=1&fs=0&enablejsapi=1&origin=${origin}`}
                title={current.title}
                className="pointer-events-none absolute left-1/2 top-[46%] h-[145%] w-[145%] -translate-x-1/2 -translate-y-1/2 border-0"
                allow="autoplay; encrypted-media"
              />
            </div>
          ) : current.video_url && current.source_type === "upload" ? (
            <video
              key={current.id}
              ref={videoRef}
              src={current.video_url}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              playsInline
              loop
              muted={muted}
              poster={current.cover ?? undefined}
              onTimeUpdate={(e) => {
                const el = e.currentTarget;
                if (!el.duration) return;
                setProgress((el.currentTime / el.duration) * 100);
              }}
            />
          ) : current.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.cover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-neutral-900" />
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/75 to-transparent" />

          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={togglePause}
              className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/60"
              aria-label={paused ? "Play" : "Pause"}
            >
              {paused ? <Play size={18} fill="currentColor" /> : <Pause size={18} />}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/60"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>

          <button
            type="button"
            onClick={enterFullscreen}
            className="cursor-pointer absolute top-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/60"
            aria-label="Fullscreen"
          >
            <Maximize size={16} />
          </button>

          <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-4">
            <h1 className="max-w-[85%] text-[15px] font-medium leading-snug text-white drop-shadow">
              {current.title}
            </h1>
            <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full bg-[#E34C33] transition-[width] duration-150"
                style={{
                  width: `${current.source_type === "upload" ? progress : paused ? 0 : 8}%`,
                }}
              />
            </div>
          </div>

          {shareNote && (
            <div className="absolute bottom-16 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/80 px-3 py-1 text-xs">
              {shareNote}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-5">
          <button
            type="button"
            onClick={() => void handleLike()}
            className="cursor-pointer flex flex-col items-center gap-1 text-white"
            aria-label="Like"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full bg-white/10 ${
                liked ? "text-[#E34C33]" : ""
              }`}
            >
              <Heart size={22} fill={liked ? "currentColor" : "none"} />
            </span>
            <span className="text-xs">{current.likes_count}</span>
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="cursor-pointer flex flex-col items-center gap-1 text-white"
            aria-label="Share"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Share2 size={20} />
            </span>
            <span className="text-xs">Share</span>
          </button>

          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={!canPrev}
              className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-full bg-white/10 disabled:opacity-30 hover:bg-white/20"
              aria-label="Previous short"
            >
              <ChevronUp size={22} />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!canNext}
              className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-full bg-white/10 disabled:opacity-30 hover:bg-white/20"
              aria-label="Next short"
            >
              <ChevronDown size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
