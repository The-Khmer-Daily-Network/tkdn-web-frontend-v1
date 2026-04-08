import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://*.googletagmanager.com https://*.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: https://www.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com; font-src 'self' data:; connect-src 'self' https://api.thekhmerdailynetwork.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://*.googletagmanager.com https://www.google.com https://stats.g.doubleclick.net; media-src 'self' https://tkdn-development-v1.sgp1.digitaloceanspaces.com;",
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
