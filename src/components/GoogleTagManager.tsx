"use client";

import Script from "next/script";

// Extend Window interface for gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export default function GoogleAnalytics() {
  // Use environment variable if available, otherwise use default
  const GA_MEASUREMENT_ID =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-CE490HDYHS";

  // Only load GA in production or if explicitly enabled
  // Remove the production check to allow GA in all environments
  const shouldLoadGA = true; // Always load GA

  if (!shouldLoadGA || !GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      {/* GA4 - Load gtag.js library */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        onLoad={() => {
          // Script loaded successfully - verify it's working
          if (typeof window !== "undefined") {
            console.log("Google Analytics script loaded successfully");
          }
        }}
        onError={(e) => {
          console.error("Failed to load Google Analytics script:", e);
        }}
      />

      {/* GA4 - Initialize and configure */}
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              send_page_view: true
            });
          `,
        }}
      />
    </>
  );
}
