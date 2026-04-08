import type {
  ContentVideoResponse,
  ContentVideoDeleteResponse,
  ContentVideo,
  UploadContentVideoResponse,
} from "@/types/contentVideo";

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
 * Fetch all content videos
 */
export async function getContentVideos(): Promise<ContentVideoResponse> {
  try {
    const url = getApiUrl("/videos-content");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "omit",
      mode: "cors", // Explicitly set CORS mode
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch content videos: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    // Get raw response text first to check for escaped slashes
    const responseText = await response.text();

    // Parse JSON
    const data = JSON.parse(responseText);

    // Fix escaped forward slashes in video URLs (in case they exist)
    if (data.success && Array.isArray(data.data)) {
      data.data = data.data.map((video: ContentVideo) => {
        // Check if URL contains escaped slashes (as string characters, not JSON escapes)
        let cleanUrl = video.video_url;
        if (typeof cleanUrl === "string") {
          // Replace any backslash followed by forward slash
          cleanUrl = cleanUrl.replace(/\\\//g, "/");
          // Also handle double backslashes
          cleanUrl = cleanUrl.replace(/\\\\/g, "\\");
        }
        return {
          ...video,
          video_url: cleanUrl,
        };
      });
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(`Your file is higher than 2MB`);
    }
    throw error;
  }
}

/**
 * Delete a content video by ID
 */
export async function deleteContentVideo(
  id: number,
): Promise<ContentVideoDeleteResponse> {
  try {
    const url = getApiUrl(`/videos-content/${id}`);

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "omit",
      mode: "cors", // Explicitly set CORS mode
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete content video: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(`Your file is higher than 2MB`);
    }
    throw error;
  }
}

/**
 * Upload a content video
 */
export interface UploadContentVideoParams {
  video: File;
  title?: string;
}

export async function uploadContentVideo({
  video,
  title,
}: UploadContentVideoParams): Promise<UploadContentVideoResponse> {
  try {
    const url = getApiUrl("/videos-content");

    // Create FormData
    const formData = new FormData();

    // Backend expects video as array, so use video[0]
    formData.append("video[0]", video);

    // Add title if provided
    if (title && title.trim()) {
      formData.append("title", title.trim());
    }

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      // Don't set Content-Type header, browser will set it with boundary for FormData
      credentials: "omit",
      mode: "cors",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to upload content video: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(`Your file is higher than 2MB`);
    }
    throw error;
  }
}

/**
 * Upload a content video via URL
 */
export interface UploadContentVideoByUrlParams {
  videoUrl: string;
  title?: string;
}

export async function uploadContentVideoByUrl({
  videoUrl,
  title,
}: UploadContentVideoByUrlParams): Promise<UploadContentVideoResponse> {
  try {
    const url = getApiUrl("/videos-content");

    // Validate URL format
    try {
      new URL(videoUrl);
    } catch {
      throw new Error("Invalid video URL format");
    }

    // Send as JSON since we're not uploading a file
    const requestBody: { video_url: string; title?: string } = {
      video_url: videoUrl,
    };

    if (title && title.trim()) {
      requestBody.title = title.trim();
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
      credentials: "omit",
      mode: "cors",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to upload content video URL: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Network error: Unable to connect to API. Please check if NEXT_PUBLIC_API_BASE_URL is set correctly and the API server is running.`,
      );
    }
    throw error;
  }
}
