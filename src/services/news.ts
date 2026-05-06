import type {
  NewsResponse,
  NewsSingleResponse,
  NewsCreateParams,
  NewsUpdateParams,
  NewsCreateResponse,
  NewsUpdateResponse,
  NewsDeleteResponse,
} from "@/types/news";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const inFlightAdminArticlesRequests = new Map<string, Promise<NewsResponse>>();
const inFlightAdminArticleByIdRequests = new Map<string, Promise<NewsSingleResponse>>();
const inFlightAdminVideosRequests = new Map<string, Promise<NewsResponse>>();
const inFlightAdminVideoByIdRequests = new Map<string, Promise<NewsSingleResponse>>();

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
 * Fetch latest national news (15 items)
 */
export async function getNationalNews(): Promise<NewsResponse> {
  try {
    const url = getApiUrl("/news/national");
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "omit",
      mode: "cors",
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch national news: ${response.status} ${response.statusText}. ${errorText}`);
    }
    return response.json();
  } catch (error) {
    console.warn("National news fetch failed, using empty fallback:", error);
    return { success: false, data: [] };
  }
}

/**
 * Fetch latest international news (15 items)
 */
export async function getInternationalNews(): Promise<NewsResponse> {
  try {
    const url = getApiUrl("/news/international");
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "omit",
      mode: "cors",
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch international news: ${response.status} ${response.statusText}. ${errorText}`);
    }
    return response.json();
  } catch (error) {
    console.warn("International news fetch failed, using empty fallback:", error);
    return { success: false, data: [] };
  }
}

/**
 * Fetch latest news videos (15 items)
 */
export async function getVideosNews(): Promise<NewsResponse> {
  try {
    const url = getApiUrl("/news/videos");
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "omit",
      mode: "cors",
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch videos: ${response.status} ${response.statusText}. ${errorText}`);
    }
    return response.json();
  } catch (error) {
    console.warn("Videos news fetch failed, using empty fallback:", error);
    return { success: false, data: [] };
  }
}

/**
 * Fetch all news/articles
 * @param categoryId - Optional category ID to filter news by category
 */
export async function getNews(categoryId?: number): Promise<NewsResponse> {
  try {
    let url = getApiUrl("/news");

    // Add category_id query parameter if provided
    if (categoryId !== undefined) {
      url += `?category_id=${categoryId}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "omit",
      mode: "cors",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch news: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    console.warn("News fetch failed, using empty fallback:", error);
    return { success: false, data: [] };
  }
}

/**
 * Fetch all admin articles
 * @param categoryId - Optional category ID to filter articles by category
 */
export async function getAdminArticles(
  categoryId?: number,
  page?: number,
  perPage?: number,
): Promise<NewsResponse> {
  try {
    let url = getApiUrl("/admin/articles");
    const params = new URLSearchParams();
    if (categoryId !== undefined) params.set("category_id", String(categoryId));
    if (page !== undefined) params.set("page", String(page));
    if (perPage !== undefined) params.set("per_page", String(perPage));
    const query = params.toString();
    if (query) url += `?${query}`;

    const existingRequest = inFlightAdminArticlesRequests.get(url);
    if (existingRequest) {
      return existingRequest;
    }

    const requestPromise = (async () => {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "omit",
        mode: "cors",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch admin articles: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }

      return response.json();
    })();

    inFlightAdminArticlesRequests.set(url, requestPromise);
    try {
      return await requestPromise;
    } finally {
      inFlightAdminArticlesRequests.delete(url);
    }
  } catch (error) {
    console.warn("Admin articles fetch failed, using empty fallback:", error);
    return { success: false, data: [] };
  }
}

/**
 * Fetch a single admin article by ID
 */
export async function getAdminArticleById(
  id: number,
): Promise<NewsSingleResponse> {
  try {
    const url = getApiUrl(`/admin/articles/${id}`);

    const existingRequest = inFlightAdminArticleByIdRequests.get(url);
    if (existingRequest) {
      return existingRequest;
    }

    const requestPromise = (async () => {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "omit",
        mode: "cors",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch admin article: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }

      return response.json();
    })();

    inFlightAdminArticleByIdRequests.set(url, requestPromise);
    try {
      return await requestPromise;
    } finally {
      inFlightAdminArticleByIdRequests.delete(url);
    }
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
 * Fetch all admin videos
 * @param categoryId - Optional category ID to filter videos by category
 */
export async function getAdminVideos(
  categoryId?: number,
  page?: number,
  perPage?: number,
): Promise<NewsResponse> {
  try {
    let url = getApiUrl("/admin/videos");
    const params = new URLSearchParams();
    if (categoryId !== undefined) params.set("category_id", String(categoryId));
    if (page !== undefined) params.set("page", String(page));
    if (perPage !== undefined) params.set("per_page", String(perPage));
    const query = params.toString();
    if (query) url += `?${query}`;

    const existingRequest = inFlightAdminVideosRequests.get(url);
    if (existingRequest) {
      return existingRequest;
    }

    const requestPromise = (async () => {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "omit",
        mode: "cors",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch admin videos: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }

      return response.json();
    })();

    inFlightAdminVideosRequests.set(url, requestPromise);
    try {
      return await requestPromise;
    } finally {
      inFlightAdminVideosRequests.delete(url);
    }
  } catch (error) {
    console.warn("Admin videos fetch failed, using empty fallback:", error);
    return { success: false, data: [] };
  }
}

/**
 * Fetch a single admin video by ID
 */
export async function getAdminVideoById(
  id: number,
): Promise<NewsSingleResponse> {
  try {
    const url = getApiUrl(`/admin/videos/${id}`);

    const existingRequest = inFlightAdminVideoByIdRequests.get(url);
    if (existingRequest) {
      return existingRequest;
    }

    const requestPromise = (async () => {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "omit",
        mode: "cors",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch admin video: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }

      return response.json();
    })();

    inFlightAdminVideoByIdRequests.set(url, requestPromise);
    try {
      return await requestPromise;
    } finally {
      inFlightAdminVideoByIdRequests.delete(url);
    }
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
 * Create a new news/article
 */
export async function createNews(
  params: NewsCreateParams,
): Promise<NewsCreateResponse> {
  try {
    const url = getApiUrl("/news");

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
        `Failed to create news: ${response.status} ${response.statusText}. ${errorText}`,
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
 * Create a new admin article
 */
export async function createAdminArticle(
  params: NewsCreateParams,
): Promise<NewsCreateResponse> {
  try {
    const url = getApiUrl("/admin/articles");

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
        `Failed to create admin article: ${response.status} ${response.statusText}. ${errorText}`,
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
 * Create a new admin video
 */
export async function createAdminVideo(
  params: NewsCreateParams,
): Promise<NewsCreateResponse> {
  try {
    const url = getApiUrl("/admin/videos");

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
        `Failed to create admin video: ${response.status} ${response.statusText}. ${errorText}`,
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
 * Update a news/article
 */
export async function updateNews(
  id: number,
  params: NewsUpdateParams,
): Promise<NewsUpdateResponse> {
  try {
    const url = getApiUrl(`/news/${id}`);

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
        `Failed to update news: ${response.status} ${response.statusText}. ${errorText}`,
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
 * Update an admin article
 */
export async function updateAdminArticle(
  id: number,
  params: NewsUpdateParams,
): Promise<NewsUpdateResponse> {
  try {
    const url = getApiUrl(`/admin/articles/${id}`);

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
        `Failed to update admin article: ${response.status} ${response.statusText}. ${errorText}`,
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
 * Update an admin video
 */
export async function updateAdminVideo(
  id: number,
  params: NewsUpdateParams,
): Promise<NewsUpdateResponse> {
  try {
    const url = getApiUrl(`/admin/videos/${id}`);

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
        `Failed to update admin video: ${response.status} ${response.statusText}. ${errorText}`,
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
 * Fetch a single news/article by ID
 */
export async function getNewsById(
  id: number,
): Promise<{ success: boolean; data: import("@/types/news").News }> {
  try {
    const url = getApiUrl(`/news/${id}`);

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
        `Failed to fetch news: ${response.status} ${response.statusText}. ${errorText}`,
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
 * Delete a news/article
 */
export async function deleteNews(id: number): Promise<NewsDeleteResponse> {
  try {
    const url = getApiUrl(`/news/${id}`);

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
        `Failed to delete news: ${response.status} ${response.statusText}. ${errorText}`,
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
 * Delete an admin article
 */
export async function deleteAdminArticle(
  id: number,
  actorUserId?: number,
): Promise<NewsDeleteResponse> {
  try {
    const url = getApiUrl(`/admin/articles/${id}`);

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body:
        actorUserId != null ? JSON.stringify({ user_id: actorUserId }) : undefined,
      credentials: "omit",
      mode: "cors",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete admin article: ${response.status} ${response.statusText}. ${errorText}`,
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
 * Delete an admin video
 */
export async function deleteAdminVideo(
  id: number,
  actorUserId?: number,
): Promise<NewsDeleteResponse> {
  try {
    const url = getApiUrl(`/admin/videos/${id}`);

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body:
        actorUserId != null ? JSON.stringify({ user_id: actorUserId }) : undefined,
      credentials: "omit",
      mode: "cors",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete admin video: ${response.status} ${response.statusText}. ${errorText}`,
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
