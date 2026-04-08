import type { SocialMediaResponse } from "@/types/socialMedia";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.warn(
    "NEXT_PUBLIC_API_BASE_URL is not defined in environment variables",
  );
}

/**
 * Get the full API URL with proper path
 */
function getApiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not defined in environment variables",
    );
  }

  // Remove trailing slash from API_BASE_URL if present
  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  // Ensure path starts with /
  const apiPath = path.startsWith("/") ? path : `/${path}`;

  // Simply concatenate baseUrl and path since baseUrl already includes /api
  return `${baseUrl}${apiPath}`;
}

/**
 * Fetch all social media links
 */
export async function getSocialMedia(): Promise<SocialMediaResponse> {
  try {
    const url = getApiUrl("/social-media");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "omit",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch social media: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching social media:", error);
    throw error;
  }
}
