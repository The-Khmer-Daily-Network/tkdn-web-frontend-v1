"use client";

import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  subtitle?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
}

export default function SEO({
  title,
  description,
  subtitle,
  keywords,
  image,
  url,
  type = "website",
  datePublished,
  dateModified,
  author,
}: SEOProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (
      name: string,
      content: string,
      attribute: string = "name",
    ) => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Primary SEO - Title and Description
    updateMetaTag("title", title);
    updateMetaTag("description", description);

    // Secondary SEO - Subtitle as additional description
    if (subtitle) {
      updateMetaTag("subtitle", subtitle);
      // Also add as og:description alternative
      updateMetaTag("og:subtitle", subtitle, "property");
    }

    // Keywords
    if (keywords) {
      updateMetaTag("keywords", keywords);
    }

    // Get base URL for absolute image URLs
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    // Ensure image URL is absolute
    const absoluteImage = image
      ? image.startsWith("http")
        ? image
        : `${baseUrl}${image.startsWith("/") ? image : `/${image}`}`
      : `${baseUrl}/assets/TKDN_Logo/TKDN_Logo_Square.png`;

    // Open Graph tags (Facebook, LinkedIn, etc.)
    updateMetaTag("og:title", title, "property");
    updateMetaTag("og:description", subtitle || description, "property");
    updateMetaTag("og:type", type, "property");
    updateMetaTag("og:site_name", "The Khmer Daily Network", "property");
    if (url) {
      updateMetaTag("og:url", url, "property");
    }
    // Always set og:image (use provided image or default logo)
    updateMetaTag("og:image", absoluteImage, "property");
    updateMetaTag("og:image:secure_url", absoluteImage, "property");
    updateMetaTag("og:image:type", "image/png", "property");
    updateMetaTag("og:image:width", "1200", "property");
    updateMetaTag("og:image:height", "1200", "property");
    updateMetaTag("og:image:alt", title, "property");

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", subtitle || description);
    updateMetaTag("twitter:image", absoluteImage);
    updateMetaTag("twitter:image:alt", title);

    // Additional SEO meta tags
    updateMetaTag("robots", "index, follow");
    updateMetaTag("author", "The Khmer Daily Network");

    // Canonical URL
    if (url) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", url);
    }

    // Structured Data (JSON-LD) for better SEO
    const baseUrlForStructured =
      typeof window !== "undefined" ? window.location.origin : "";

    const structuredData = {
      "@context": "https://schema.org",
      "@type": type === "article" ? "NewsArticle" : "WebSite",
      ...(type === "article"
        ? {
            headline: title,
            description: subtitle || description,
            image: {
              "@type": "ImageObject",
              url: absoluteImage,
              width: 1200,
              height: 630,
            },
            datePublished: datePublished || new Date().toISOString(),
            dateModified:
              dateModified || datePublished || new Date().toISOString(),
            author: {
              "@type": "Person",
              name: author || "The Khmer Daily Network",
            },
            publisher: {
              "@type": "Organization",
              name: "The Khmer Daily Network",
              logo: {
                "@type": "ImageObject",
                url: `${baseUrlForStructured}/assets/TKDN_Logo/TKDN_Logo_Square.png`,
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": url || baseUrlForStructured,
            },
          }
        : {
            name: title,
            description: subtitle || description,
            url: baseUrlForStructured,
            image: {
              "@type": "ImageObject",
              url: absoluteImage,
            },
            publisher: {
              "@type": "Organization",
              name: "The Khmer Daily Network",
              logo: {
                "@type": "ImageObject",
                url: `${baseUrlForStructured}/assets/TKDN_Logo/TKDN_Logo_Square.png`,
              },
            },
          }),
    };

    // Remove existing structured data script if any
    const existingScript = document.querySelector(
      'script[type="application/ld+json"]',
    );
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      // Optionally clean up on unmount
    };
  }, [
    title,
    description,
    subtitle,
    keywords,
    image,
    url,
    type,
    datePublished,
    dateModified,
    author,
  ]);

  return null; // This component doesn't render anything
}
