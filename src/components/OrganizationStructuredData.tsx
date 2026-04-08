"use client";

import { useEffect } from "react";

/**
 * Organization Structured Data Component
 *
 * This component adds JSON-LD structured data for:
 * 1. NewsMediaOrganization - Required for Google News Publisher Center
 * 2. WebSite with SearchAction - Enables sitelinks search box in Google
 *
 * Reference: https://developers.google.com/search/docs/appearance/structured-data/organization
 */
export default function OrganizationStructuredData() {
  useEffect(() => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://thekhmerdailynetwork.com";

    // Remove existing structured data scripts
    const existingOrgScript = document.querySelector(
      'script[type="application/ld+json"][data-organization]',
    );
    const existingWebsiteScript = document.querySelector(
      'script[type="application/ld+json"][data-website]',
    );
    if (existingOrgScript) existingOrgScript.remove();
    if (existingWebsiteScript) existingWebsiteScript.remove();

    // NewsMediaOrganization - Critical for Google News
    // Reference: https://developers.google.com/search/docs/appearance/structured-data/organization
    const organizationData = {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      "@id": `${baseUrl}/#organization`,
      name: "The Khmer Daily Network",
      legalName: "The Khmer Daily Network",
      alternateName: [
        "TKDN",
        "The Khmer",
        "Khmer Daily",
        "Khmer Network",
        "Daily Network",
        "TKDN News",
      ],
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        "@id": `${baseUrl}/#logo`,
        url: `${baseUrl}/assets/TKDN_Logo/TKDN_Logo_Square.png`,
        contentUrl: `${baseUrl}/assets/TKDN_Logo/TKDN_Logo_Square.png`,
        width: 512,
        height: 512,
        caption: "The Khmer Daily Network Logo",
      },
      image: {
        "@type": "ImageObject",
        url: `${baseUrl}/assets/TKDN_Logo/TKDN_Logo_Rectangle.jpg`,
        width: 1200,
        height: 630,
      },
      // Social media profiles - important for brand verification
      sameAs: [
        "https://www.facebook.com/TheKhmersDailyNetwork",
        "https://www.youtube.com/@TheKhmerDailyNetworks",
        // Add other verified social profiles
      ],
      description:
        "The Khmer Daily Network is Cambodia's trusted source for the latest news, breaking stories, and in-depth coverage. Stay informed with reliable journalism from TKDN.",

      // Contact information - helps with Google Business Profile
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer service",
          availableLanguage: ["Khmer", "English"],
          url: `${baseUrl}/about-us`,
        },
      ],

      // Publishing principles - builds trust with Google News
      publishingPrinciples: `${baseUrl}/about-us`,

      // Founding date if known
      // "foundingDate": "2020-01-01",

      // Area served
      areaServed: {
        "@type": "Country",
        name: "Cambodia",
      },

      // Languages
      knowsLanguage: ["km", "en"],
    };

    // WebSite with SearchAction - Enables sitelinks search box
    const websiteData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      name: "The Khmer Daily Network",
      alternateName: ["TKDN", "Khmer Daily", "TKDN News"],
      url: baseUrl,
      description:
        "The Khmer Daily Network - Cambodia's trusted source for news, articles, and videos.",
      inLanguage: ["km", "en"],
      publisher: {
        "@id": `${baseUrl}/#organization`,
      },
      // SearchAction - enables sitelinks search box in Google
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    };

    // Add organization structured data
    const orgScript = document.createElement("script");
    orgScript.type = "application/ld+json";
    orgScript.setAttribute("data-organization", "true");
    orgScript.text = JSON.stringify(organizationData);
    document.head.appendChild(orgScript);

    // Add website structured data
    const websiteScript = document.createElement("script");
    websiteScript.type = "application/ld+json";
    websiteScript.setAttribute("data-website", "true");
    websiteScript.text = JSON.stringify(websiteData);
    document.head.appendChild(websiteScript);

    // Cleanup on unmount
    return () => {
      const orgScriptToRemove = document.querySelector(
        'script[type="application/ld+json"][data-organization]',
      );
      const websiteScriptToRemove = document.querySelector(
        'script[type="application/ld+json"][data-website]',
      );
      if (orgScriptToRemove) orgScriptToRemove.remove();
      if (websiteScriptToRemove) websiteScriptToRemove.remove();
    };
  }, []);

  return null;
}
