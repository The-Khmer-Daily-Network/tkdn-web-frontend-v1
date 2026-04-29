import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack's workspace root so `next` resolves during HMR (avoids intermittent
  // "Next.js package not found" panics when the inferred root is wrong). See:
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tkdn-development-v1.sgp1.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "tkdn-development-v1.sgp1.cdn.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "www.reuters.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    qualities: [100, 75],
  },
  // Security headers
  async headers() {
    return [
      // Exclude sitemap.xml and robots.txt from security headers to ensure pure XML/text
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Content-Type",
            value: "application/xml; charset=utf-8",
          },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Content-Type",
            value: "text/plain; charset=utf-8",
          },
        ],
      },
      // Apply security headers to all other routes
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://*.googletagmanager.com https://*.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: https://www.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com https://i.ytimg.com https://img.youtube.com; font-src 'self' data:; connect-src 'self' https://api.thekhmerdailynetwork.com http://127.0.0.1:8000 http://localhost:8000 https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google.com https://stats.g.doubleclick.net; media-src 'self' blob: https://*.digitaloceanspaces.com https://*.cdn.digitaloceanspaces.com https://*.youtube.com https://*.googlevideo.com; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com;",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
