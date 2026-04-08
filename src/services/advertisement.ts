import type {
  AdvertisementImageResponse,
  AdvertisementImageUploadParams,
  AdvertisementImageUploadResponse,
  AdvertisementImageDeleteResponse,
  AdvertisementResponse,
  AdvertisementCreateParams,
  AdvertisementUpdateParams,
  AdvertisementCreateResponse,
  AdvertisementUpdateResponse,
  AdvertisementDeleteResponse,
} from "@/types/advertisement";

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
 * Advertisement Image APIs
 */

/**
 * Fetch all advertisement images
 */
export async function getAdvertisementImages(): Promise<AdvertisementImageResponse> {
  try {
    const url = getApiUrl("/advertisement-image");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "omit",
      mode: "cors",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch advertisement images: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    console.warn(
      "Advertisement images fetch failed, using empty fallback:",
      error,
    );
    return { success: false, data: [] };
  }
}

/**
 * Upload advertisement image
 */
export async function uploadAdvertisementImage(
  image: File,
  position: string,
): Promise<AdvertisementImageUploadResponse> {
  try {
    const url = getApiUrl("/advertisement-image");

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(image.type)) {
      throw new Error("Only JPG, PNG, GIF, and WebP files are allowed");
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (image.size > maxSize) {
      throw new Error("File size must be less than 10MB");
    }

    // Create FormData
    // Backend expects single image file (not array)
    const formData = new FormData();
    formData.append("image", image);
    formData.append("position", position);

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
        `Failed to upload image: ${response.status} ${response.statusText}. ${errorText}`,
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
 * Delete advertisement image
 */
export async function deleteAdvertisementImage(
  id: number,
): Promise<AdvertisementImageDeleteResponse> {
  try {
    const url = getApiUrl(`/advertisement-image/${id}`);

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "omit",
      mode: "cors",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete advertisement image: ${response.status} ${response.statusText}. ${errorText}`,
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
 * Advertisement APIs
 */

/**
 * Fetch all advertisements
 */
export async function getAdvertisements(): Promise<AdvertisementResponse> {
  try {
    const url = getApiUrl("/advertisement");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "omit",
      mode: "cors",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch advertisements: ${response.status} ${response.statusText}. ${errorText}`,
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
 * Create a new advertisement
 */
export async function createAdvertisement(
  params: AdvertisementCreateParams,
): Promise<AdvertisementCreateResponse> {
  try {
    const url = getApiUrl("/advertisement");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(params),
      credentials: "omit",
      mode: "cors",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create advertisement: ${response.status} ${response.statusText}. ${errorText}`,
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
 * Update an advertisement
 */
export async function updateAdvertisement(
  id: number,
  params: AdvertisementUpdateParams,
): Promise<AdvertisementUpdateResponse> {
  try {
    const url = getApiUrl(`/advertisement/${id}`);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(params),
      credentials: "omit",
      mode: "cors",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to update advertisement: ${response.status} ${response.statusText}. ${errorText}`,
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
 * Delete an advertisement
 */
export async function deleteAdvertisement(
  id: number,
): Promise<AdvertisementDeleteResponse> {
  try {
    const url = getApiUrl(`/advertisement/${id}`);

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "omit",
      mode: "cors",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete advertisement: ${response.status} ${response.statusText}. ${errorText}`,
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
