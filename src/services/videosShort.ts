import { getApiUrl } from "@/lib/api-url";
import type {
  VideoShort,
  VideoShortListResponse,
  VideoShortSingleResponse,
} from "@/types/videosShort";

async function parseError(response: Response): Promise<string> {
  const raw = await response.text();
  try {
    const parsed = JSON.parse(raw) as {
      message?: string;
      errors?: Record<string, string[]>;
    };
    const firstFieldError = parsed?.errors
      ? Object.values(parsed.errors).flat()[0]
      : undefined;
    if (firstFieldError) return firstFieldError;
    if (parsed?.message) return parsed.message;
  } catch {
    // keep raw
  }
  return raw || `${response.status} ${response.statusText}`;
}

export async function getVideoShorts(all = false): Promise<VideoShortListResponse> {
  const url = getApiUrl(all ? "/videos-short?all=1" : "/videos-short");
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "omit",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch shorts: ${await parseError(response)}`);
  }
  return response.json();
}

export async function createVideoShort(
  formData: FormData,
): Promise<VideoShortSingleResponse> {
  const response = await fetch(getApiUrl("/videos-short"), {
    method: "POST",
    headers: { Accept: "application/json" },
    body: formData,
    credentials: "omit",
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function updateVideoShort(
  id: number,
  formData: FormData,
): Promise<VideoShortSingleResponse> {
  formData.append("_method", "PUT");
  const response = await fetch(getApiUrl(`/videos-short/${id}`), {
    method: "POST",
    headers: { Accept: "application/json" },
    body: formData,
    credentials: "omit",
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function deleteVideoShort(id: number): Promise<void> {
  const response = await fetch(getApiUrl(`/videos-short/${id}`), {
    method: "DELETE",
    headers: { Accept: "application/json" },
    credentials: "omit",
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function incrementVideoShortView(id: number): Promise<VideoShort> {
  const response = await fetch(getApiUrl(`/videos-short/${id}/view`), {
    method: "POST",
    headers: { Accept: "application/json" },
    credentials: "omit",
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const data: VideoShortSingleResponse = await response.json();
  return data.data;
}

export async function incrementVideoShortLike(id: number): Promise<VideoShort> {
  const response = await fetch(getApiUrl(`/videos-short/${id}/like`), {
    method: "POST",
    headers: { Accept: "application/json" },
    credentials: "omit",
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const data: VideoShortSingleResponse = await response.json();
  return data.data;
}

export function youtubeIdFromUrl(url?: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/i,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/i,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/i,
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/i,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function youtubeEmbedUrl(url?: string | null): string | null {
  const id = youtubeIdFromUrl(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
