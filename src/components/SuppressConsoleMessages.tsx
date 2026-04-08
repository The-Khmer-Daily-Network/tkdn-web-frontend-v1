"use client";

import { useEffect } from "react";

export default function SuppressConsoleMessages() {
  useEffect(() => {
    // Suppress React DevTools message
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args[0]?.toString() || "";
      if (message.includes("Download the React DevTools")) {
        return;
      }
      originalWarn.apply(console, args);
    };

    // Suppress HMR and Fast Refresh messages
    const originalLog = console.log;
    console.log = (...args) => {
      const message = args[0]?.toString() || "";
      if (
        message.includes("[HMR]") ||
        message.includes("[Fast Refresh]") ||
        message.includes("Download the React DevTools")
      ) {
        return;
      }
      originalLog.apply(console, args);
    };

    // Suppress info messages too (in case HMR uses console.info)
    const originalInfo = console.info;
    console.info = (...args) => {
      const message = args[0]?.toString() || "";
      if (
        message.includes("[HMR]") ||
        message.includes("[Fast Refresh]") ||
        message.includes("Download the React DevTools")
      ) {
        return;
      }
      originalInfo.apply(console, args);
    };

    // Cleanup function to restore original console methods
    return () => {
      console.warn = originalWarn;
      console.log = originalLog;
      console.info = originalInfo;
    };
  }, []);

  return null;
}
