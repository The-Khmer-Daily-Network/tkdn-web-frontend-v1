"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Headphones, Pause, Share2, Volume2, VolumeX } from "lucide-react";

const NAVY = "#1e3a5f";
const SPEEDS = [0.75, 1, 1.5, 2] as const;

function formatSpeedLabel(rate: number) {
  return `x${rate}`;
}

export interface NewsAudioPlayerProps {
  src?: string;
  className?: string;
  showListenButton?: boolean;
}

export default function NewsAudioPlayer({
  src = "",
  className = "",
  showListenButton = true,
}: NewsAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const hasAudio = Boolean(src);

  useEffect(() => {
    setDuration(0);
    setIsPlaying(false);
    setSpeedIndex(1);
    setIsMuted(false);
    const audio = audioRef.current;
    if (audio && src) {
      audio.src = src;
      audio.load();
    }
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = SPEEDS[speedIndex];
  }, [speedIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : 1;
  }, [isMuted]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!shareMenuRef.current) return;
      if (shareMenuRef.current.contains(event.target as Node)) return;
      setIsShareOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [isPlaying]);

  const onLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(audio.duration)) {
      setDuration(audio.duration);
    }
  }, []);

  const onPlay = useCallback(() => setIsPlaying(true), []);
  const onPause = useCallback(() => setIsPlaying(false), []);
  const onEnded = useCallback(() => setIsPlaying(false), []);

  const cycleSpeed = useCallback(() => {
    setSpeedIndex((index) => (index + 1) % SPEEDS.length);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((muted) => !muted);
  }, []);

  const getShareUrl = useCallback(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, []);

  const getShortShareUrl = useCallback(() => {
    if (typeof window === "undefined") return "";

    const { origin, pathname, search } = window.location;
    const match = pathname.match(/\/news\/(?:.*-)?(\d+)$/);
    if (!match?.[1]) {
      return `${origin}${pathname}${search}`;
    }

    return `${origin}/news/${match[1]}`;
  }, []);

  const shareTitle = typeof document !== "undefined" ? document.title : "";

  const openShareLink = useCallback((shareUrl: string) => {
    if (typeof window === "undefined") return;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }, []);

  const handleShareOption = useCallback(
    async (service: "facebook" | "instagram" | "linkedin" | "telegram" | "x" | "copy") => {
      const url = getShareUrl();
      if (!url) return;

      const shortUrl = getShortShareUrl();
      const encodedUrl = encodeURIComponent(url);
      const encodedTitle = encodeURIComponent(shareTitle || url);

      if (service === "copy") {
        await navigator.clipboard.writeText(shortUrl || url);
        setIsShareOpen(false);
        return;
      }

      if (service === "instagram") {
        if (navigator.share) {
          await navigator.share({
            title: shareTitle,
            text: shareTitle,
            url,
          });
        } else {
          await navigator.clipboard.writeText(url);
        }
        setIsShareOpen(false);
        return;
      }

      if (service === "facebook") {
        openShareLink(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
      } else if (service === "linkedin") {
        openShareLink(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`);
      } else if (service === "telegram") {
        openShareLink(`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`);
      } else if (service === "x") {
        openShareLink(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`);
      }

      setIsShareOpen(false);
    },
    [getShareUrl, getShortShareUrl, openShareLink, shareTitle],
  );

  const displayMinutes = Math.max(1, Math.round(duration / 60));
  const listenLabel = isPlaying
    ? `Listening (${displayMinutes} mins)`
    : `Listen (${displayMinutes} mins)`;

  return (
    <div className={`w-full ${className}`}>
      {hasAudio && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          className="hidden"
          onLoadedMetadata={onLoadedMetadata}
          onDurationChange={onLoadedMetadata}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
        >
          <track
            kind="captions"
            label="English"
            srcLang="en"
            default
            src="data:text/vtt;charset=utf-8,WEBVTT%0A%0A00:00:00.000 --> 00:00:01.000%0A%0A"
          />
        </audio>
      )}

      <div className="flex w-full min-w-0 flex-wrap items-center gap-2" style={{ color: NAVY }}>
        {showListenButton && hasAudio && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Listening" : "Listen"}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm transition-opacity hover:opacity-90"
            style={{ color: NAVY }}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: NAVY }}>
              {isPlaying ? (
                <Pause className="h-3 w-3 text-white" strokeWidth={2.25} aria-hidden />
              ) : (
                <Headphones className="h-3 w-3 text-white" aria-hidden />
              )}
            </span>
            <span className="whitespace-nowrap text-sm font-medium sm:text-[15px]">
              {listenLabel}
            </span>
          </button>
        )}

        <div className="relative" ref={shareMenuRef}>
          <button
            type="button"
            onClick={() => setIsShareOpen((open) => !open)}
            aria-label="Share"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm transition-opacity hover:opacity-90"
            style={{ color: NAVY }}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: NAVY }}>
              <Share2 className="h-3 w-3 text-white" aria-hidden />
            </span>
            <span className="whitespace-nowrap text-sm font-medium sm:text-[15px]">Share</span>
          </button>

          {isShareOpen && (
            <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-sm hover:bg-gray-50"
                onClick={() => void handleShareOption("facebook")}
              >
                <span>Facebook</span>
                <span className="text-xs text-gray-500">Share</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-sm hover:bg-gray-50"
                onClick={() => void handleShareOption("instagram")}
              >
                <span>Instagram</span>
                <span className="text-xs text-gray-500">Open</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-sm hover:bg-gray-50"
                onClick={() => void handleShareOption("linkedin")}
              >
                <span>LinkedIn</span>
                <span className="text-xs text-gray-500">Share</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-sm hover:bg-gray-50"
                onClick={() => void handleShareOption("telegram")}
              >
                <span>Telegram</span>
                <span className="text-xs text-gray-500">Share</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-sm hover:bg-gray-50"
                onClick={() => void handleShareOption("x")}
              >
                <span>X</span>
                <span className="text-xs text-gray-500">Share</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-sm hover:bg-gray-50"
                onClick={() => void handleShareOption("copy")}
              >
                <span className="inline-flex items-center gap-2">
                  <Copy className="h-3 w-3" aria-hidden />
                  Copy link
                </span>
                <span className="text-xs text-gray-500">Copy</span>
              </button>
            </div>
          )}
        </div>

        {showListenButton && hasAudio && (
          <>
            <button
              type="button"
              onClick={cycleSpeed}
              className="cursor-pointer shrink-0 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium tabular-nums shadow-sm transition-opacity hover:opacity-90"
              style={{ color: NAVY }}
              aria-label={`Playback speed ${formatSpeedLabel(SPEEDS[speedIndex])}`}
            >
              {formatSpeedLabel(SPEEDS[speedIndex])}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="cursor-pointer shrink-0 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium shadow-sm transition-opacity hover:opacity-90"
              style={{ color: NAVY }}
            >
              {isMuted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
