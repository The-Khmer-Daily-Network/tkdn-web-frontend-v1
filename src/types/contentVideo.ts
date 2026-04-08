export interface ContentVideo {
  id: number;
  video_url: string;
  title: string;
  original_name: string;
  created_at: string;
  updated_at: string;
}

export interface ContentVideoResponse {
  success: boolean;
  data: ContentVideo[];
}

export interface ContentVideoDeleteResponse {
  success: boolean;
  message: string;
}

export interface UploadContentVideoResponse {
  success: boolean;
  message: string;
  data: ContentVideo | ContentVideo[];
  warnings?: string[];
}
