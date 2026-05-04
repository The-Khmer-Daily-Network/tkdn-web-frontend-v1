"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

/** Dark navy — matches reference pill player accent */
const NAVY = "#1e3a5f";
const INACTIVE_BAR = "#e5e7eb";

const SPEEDS = [0.75, 1, 1.5, 2] as const;

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatSpeedLabel(r: number) {
  if (Number.isInteger(r)) return `x${r}`;
  return `x${r}`;
}

export interface NewsAudioPlayerProps {
  src: string;
  className?: string;
}

export default function NewsAudioPlayer({ src, className = "" }: NewsAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const barHeights = useMemo(() => {
    const n = 56;
    const out: number[] = [];
    let seed = hashString(src || "audio");
    for (let i = 0; i < n; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const t = (i / n) * Math.PI * 6;
      const wave = (Math.sin(t) * 0.5 + 0.5) * 0.65;
      const noise = (seed % 80) / 80;
      out.push(Math.min(1, Math.max(0.12, 0.22 + wave * 0.55 + noise * 0.2)));
    }
    return out;
  }, [src]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setSpeedIndex(1);
    const a = audioRef.current;
    if (a) {
      a.load();
    }
  }, [src]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.playbackRate = SPEEDS[speedIndex];
  }, [speedIndex]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = isMuted ? 0 : 1;
  }, [isMuted, src]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
    } else {
      void a.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [isPlaying]);

  const onTimeUpdate = useCallback(() => {
    const a = audioRef.current;
    if (a) setCurrentTime(a.currentTime);
  }, []);

  const onLoadedMetadata = useCallback(() => {
    const a = audioRef.current;
    if (a && Number.isFinite(a.duration)) {
      setDuration(a.duration);
    }
  }, []);

  const onPlay = useCallback(() => setIsPlaying(true), []);
  const onPause = useCallback(() => setIsPlaying(false), []);
  const onEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const seek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const a = audioRef.current;
      if (!a) return;
      const d = a.duration;
      if (!Number.isFinite(d) || d <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      a.currentTime = pct * d;
      setCurrentTime(a.currentTime);
    },
    [],
  );

  const cycleSpeed = useCallback(() => {
    setSpeedIndex((i) => (i + 1) % SPEEDS.length);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
  }, []);

  const progress =
    duration > 0 && Number.isFinite(duration) ? currentTime / duration : 0;

  return (
    <div className={`w-full ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="hidden"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onDurationChange={onLoadedMetadata}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
      />

      <div
        className="flex w-full min-w-0 items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-sm sm:gap-2 sm:px-3 sm:py-2"
        style={{ color: NAVY }}
      >
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="cursor-pointer flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90 sm:h-8 sm:w-8"
          style={{ backgroundColor: NAVY }}
        >
          {isPlaying ? (
            <Pause className="h-3 w-3 shrink-0 text-white" strokeWidth={2.25} aria-hidden />
          ) : (
            <Play className="ml-px h-3 w-3 shrink-0 fill-white text-white" aria-hidden />
          )}
        </button>

        <button
          type="button"
          onClick={cycleSpeed}
          className="cursor-pointer shrink-0 px-0.5 text-[11px] font-medium tabular-nums sm:text-xs"
          style={{ color: NAVY }}
          aria-label={`Playback speed ${formatSpeedLabel(SPEEDS[speedIndex])}`}
        >
          {formatSpeedLabel(SPEEDS[speedIndex])}
        </button>

        <div
          role="slider"
          aria-label="Seek"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          className="relative flex h-6 min-w-0 flex-1 cursor-pointer items-end justify-between gap-px px-0.5 sm:gap-[2px]"
          onClick={seek}
          onKeyDown={(e) => {
            const a = audioRef.current;
            if (!a || !duration) return;
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              const step = 5;
              const delta = e.key === "ArrowLeft" ? -step : step;
              a.currentTime = Math.max(0, Math.min(duration, a.currentTime + delta));
              setCurrentTime(a.currentTime);
            }
          }}
        >
          {barHeights.map((h, i) => {
            const barCenter = (i + 0.5) / barHeights.length;
            const played = barCenter <= progress;
            return (
              <div
                key={i}
                className="pointer-events-none w-[2px] shrink-0 rounded-full sm:w-[3px]"
                style={{
                  height: `${Math.round(4 + h * 14)}px`,
                  backgroundColor: played ? NAVY : INACTIVE_BAR,
                }}
              />
            );
          })}
          {/* Playhead line (reference UI) */}
          {duration > 0 && (
            <div
              className="pointer-events-none absolute bottom-0 top-0 z-10 w-0.5 -translate-x-1/2 rounded-full"
              style={{
                left: `${progress * 100}%`,
                backgroundColor: NAVY,
              }}
              aria-hidden
            />
          )}
        </div>

        <div
          className="shrink-0 whitespace-nowrap text-[10px] tabular-nums sm:text-[11px]"
          style={{ color: NAVY }}
        >
          {formatTime(currentTime)}/{formatTime(duration)}
        </div>

        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
          className="cursor-pointer shrink-0 rounded-md p-0.5 transition-opacity hover:opacity-70"
          style={{ color: NAVY }}
        >
          {isMuted ? (
            <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
          ) : (
            <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
