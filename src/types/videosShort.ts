export type VideoShortSourceType = "youtube" | "upload";

export interface VideoShort {
  id: number;
  title: string;
  source_type: VideoShortSourceType;
  youtube_url: string | null;
  video_url: string | null;
  cover: string | null;
  is_active: boolean;
  sort_order: number;
  views_count: number;
  likes_count: number;
  duration_seconds: number | null;
  original_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoShortListResponse {
  success: boolean;
  data: VideoShort[];
}

export interface VideoShortSingleResponse {
  success: boolean;
  message?: string;
  data: VideoShort;
}
