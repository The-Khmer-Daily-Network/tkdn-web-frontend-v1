import type {
  ContentImageResponse,
  ContentImageDeleteResponse,
  ContentImage,
  UploadContentImageResponse,
} from "@/types/contentImage";

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
 * Fetch all content images
 */
export async function getContentImages(): Promise<ContentImageResponse> {
  try {
    const url = getApiUrl("/images-content");

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
        `Failed to fetch content images: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Network error: Unable to connect to API. Please check your connection and API server.`,
      );
    }
    throw error;
  }
}

/**
 * Delete a content image by ID
 */
export async function deleteContentImage(
  id: number,
): Promise<ContentImageDeleteResponse> {
  try {
    const url = getApiUrl(`/images-content/${id}`);

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
        `Failed to delete content image: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Network error: Unable to connect to API. Please check your connection and API server.`,
      );
    }
    throw error;
  }
}

/**
 * Upload a content image
 */
export interface UploadContentImageParams {
  image: File;
  title?: string;
}

export async function uploadContentImage({
  image,
  title,
}: UploadContentImageParams): Promise<UploadContentImageResponse> {
  try {
    const url = getApiUrl("/images-content");

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(image.type)) {
      throw new Error("Only JPG, PNG, JPEG, and WEBP files are allowed");
    }

    // Validate file size (20MB max)
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes
    if (image.size > maxSize) {
      throw new Error("File size must be less than or equal to 20MB");
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
        `Failed to upload content image: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Network error: Unable to connect to API. Please check your connection and API server.`,
      );
    }
    throw error;
  }
}

/**
 * Upload content images via URL
 */
export interface UploadContentImageByUrlParams {
  imageUrl: string;
  title?: string;
}

export async function uploadContentImageByUrl({
  imageUrl,
  title,
}: UploadContentImageByUrlParams): Promise<UploadContentImageResponse> {
  try {
    const url = getApiUrl("/images-content");

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
        `Failed to upload content image URL: ${response.status} ${response.statusText}. ${errorText}`,
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

/**
 * Upload multiple content images via URLs
 */
export interface UploadMultipleContentImagesByUrlParams {
  imageUrls: string[];
  title?: string;
}

export async function uploadMultipleContentImagesByUrl({
  imageUrls,
  title,
}: UploadMultipleContentImagesByUrlParams): Promise<UploadContentImageResponse> {
  try {
    const url = getApiUrl("/images-content");

    // Validate all URLs
    for (const imageUrl of imageUrls) {
      try {
        new URL(imageUrl);
      } catch {
        throw new Error(`Invalid image URL format: ${imageUrl}`);
      }
    }

    // Send as JSON - backend should handle array of URLs
    const requestBody: { image_urls: string[]; title?: string } = {
      image_urls: imageUrls,
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
        `Failed to upload content image URLs: ${response.status} ${response.statusText}. ${errorText}`,
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

/**
 * Upload multiple content images in a single request
 */
export interface UploadMultipleContentImagesParams {
  images: File[];
  title?: string;
}

export async function uploadMultipleContentImages({
  images,
  title,
}: UploadMultipleContentImagesParams): Promise<UploadContentImageResponse> {
  try {
    const url = getApiUrl("/images-content");

    // Validate all files
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes

    for (const image of images) {
      if (!allowedTypes.includes(image.type)) {
        throw new Error(
          `${image.name}: Only JPG, PNG, JPEG, and WEBP files are allowed`,
        );
      }
      if (image.size > maxSize) {
        throw new Error(
          `${image.name}: File size must be less than or equal to 20MB`,
        );
      }
    }

    // Create FormData
    const formData = new FormData();

    // Backend expects image as array, append all images
    images.forEach((image, index) => {
      formData.append(`image[${index}]`, image);
    });

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
        `Failed to upload content images: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Network error: Unable to connect to API. Please check your connection and API server.`,
      );
    }
    throw error;
  }
}
