"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

const STORAGE_KEY = "tkdn_welcome_popup_seen";
const IMAGE_PATH = "/all_assets/TKDNteams.jpg";
const DURATION_MS = 2000;
const ANIMATION_MS = 500;

export default function WelcomePopup() {
  const [show, setShow] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    setIsClosing(true);
    closeTimeoutRef.current = setTimeout(() => {
      setShow(false);
      closeTimeoutRef.current = null;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(STORAGE_KEY, "true");
        } catch {
          // ignore
        }
      }
    }, ANIMATION_MS);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (seen !== "true") setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setIsOpen(true), 10);
    return () => clearTimeout(t);
  }, [show]);

  useEffect(() => {
    if (!show) return;
    autoCloseTimerRef.current = setTimeout(close, DURATION_MS);
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, [show, close]);

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to The Khmer Daily Network"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70"
      onClick={close}
      style={{
        opacity: isClosing ? 0 : isOpen ? 1 : 0,
        transition: `opacity ${ANIMATION_MS}ms ease-out`,
      }}
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: isClosing ? "scale(0.95)" : isOpen ? "scale(1)" : "scale(0.95)",
          opacity: isClosing ? 0 : isOpen ? 1 : 0,
          transition: `transform ${ANIMATION_MS}ms ease-out, opacity ${ANIMATION_MS}ms ease-out`,
        }}
      >
        <Image
          src={IMAGE_PATH}
          alt="The Khmer Daily Network Team"
          width={1200}
          height={800}
          className="h-auto w-full max-h-[90vh] object-contain"
          priority
        />
      </div>
    </div>
  );
}
