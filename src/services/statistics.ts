export interface Statistics {
  id: number;
  facebook: number;
  youtube: number;
  tiktok: number;
  linkedin: number;
  website: number;
  instagram: number;
  website_male: number;
  website_female: number;
  articles_published: number;
  videos_published: number;
  user_demographic: UserDemographicItem[] | null;
  created_at: string;
  updated_at: string;
}

export interface UserDemographicItem {
  top1?: string;
  top1_percentage?: number;
  top2?: string;
  top2_percentage?: number;
  top3?: string;
  top3_percentage?: number;
  top4?: string;
  top4_percentage?: number;
  top5?: string;
  top5_percentage?: number;
}

export interface StatisticsResponse {
  success: boolean;
  data: Statistics;
  message?: string;
}

export interface UpdateStatisticsParams {
  facebook?: number;
  youtube?: number;
  tiktok?: number;
  linkedin?: number;
  website?: number;
  instagram?: number;
  website_male?: number;
  website_female?: number;
  user_demographic?: UserDemographicItem[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.warn(
    "NEXT_PUBLIC_API_BASE_URL is not defined in environment variables",
  );
}

// In-memory de-dupe/cache for client navigation & React Strict Mode.
// This ensures multiple components calling getStatistics() share one network request.
let cachedStatisticsResponse: StatisticsResponse | null = null;
let inFlightStatisticsPromise: Promise<StatisticsResponse> | null = null;

/**
 * Get the full API URL with proper path
 */
function getApiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not defined in environment variables",
    );
  }

  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  const apiPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${apiPath}`;
}

/**
 * Fetch statistics
 */
export async function getStatistics(): Promise<StatisticsResponse> {
  if (cachedStatisticsResponse) return cachedStatisticsResponse;
  if (inFlightStatisticsPromise) return inFlightStatisticsPromise;

  try {
    const url = getApiUrl("/statistics");

    inFlightStatisticsPromise = (async () => {
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
          `Failed to fetch statistics: ${response.status} ${response.statusText}. ${errorText}`,
        );
      }

      const json = (await response.json()) as StatisticsResponse;
      cachedStatisticsResponse = json;
      return json;
    })();

    return await inFlightStatisticsPromise;
  } catch (error) {
    console.error("Error fetching statistics:", error);
    cachedStatisticsResponse = null;
    throw error;
  } finally {
    inFlightStatisticsPromise = null;
  }
}

/**
 * Update statistics
 */
export async function updateStatistics(
  params: UpdateStatisticsParams,
): Promise<StatisticsResponse> {
  try {
    const url = getApiUrl("/statistics");

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(params),
      credentials: "omit",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to update statistics: ${response.status} ${response.statusText}. ${errorText}`,
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error updating statistics:", error);
    throw error;
  }
}
