import type {
  ContentCoverResponse,
  ContentCoverDeleteResponse,
  ContentCover,
} from "@/types/contentCover";

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
 * Fetch all content cover images (backend returns paginated, but we'll fetch page by page if needed)
 */
export async function getContentCovers(): Promise<ContentCoverResponse> {
  try {
    const url = getApiUrl("/content-cover");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      // Add credentials if needed for CORS
      credentials: "omit",
      mode: "cors", // Explicitly set CORS mode
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch content covers: ${response.status} ${response.statusText}. ${errorText}`,
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
 * Delete a content cover image by ID
 */
export async function deleteContentCover(
  id: number,
): Promise<ContentCoverDeleteResponse> {
  try {
    const url = getApiUrl(`/content-cover/${id}`);

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
        `Failed to delete content cover: ${response.status} ${response.statusText}. ${errorText}`,
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
 * Upload a content cover image
 */
export interface UploadContentCoverParams {
  image: File;
  title?: string;
}

export interface UploadContentCoverResponse {
  success: boolean;
  message: string;
  data: ContentCover | ContentCover[];
  warnings?: string[];
}

/**
 * Upload a content cover image via URL
 */
export interface UploadContentCoverByUrlParams {
  imageUrl: string;
  title?: string;
}

export async function uploadContentCoverByUrl({
  imageUrl,
  title,
}: UploadContentCoverByUrlParams): Promise<UploadContentCoverResponse> {
  try {
    const url = getApiUrl("/content-cover");

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      throw new Error("Invalid image URL format");
    }

    // Send as JSON since we're not uploading a file
    const requestBody: { image_url: string; title?: string } = {
      image_url: imageUrl,
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
        `Failed to upload content cover URL: ${response.status} ${response.statusText}. ${errorText}`,
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

export async function uploadContentCover({
  image,
  title,
}: UploadContentCoverParams): Promise<UploadContentCoverResponse> {
  try {
    const url = getApiUrl("/content-cover");

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(image.type)) {
      throw new Error("Only JPG, PNG, and JPEG files are allowed");
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (image.size > maxSize) {
      throw new Error("File size must be less than 2MB");
    }

    // Create FormData
    const formData = new FormData();

    // Backend expects image as array, so use image[0]
    formData.append("image[0]", image);

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
        `Failed to upload content cover: ${response.status} ${response.statusText}. ${errorText}`,
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
