export interface ContentCover {
  id: number;
  image_url: string;
  title: string;
  original_name: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface ContentCoverResponse {
  success: boolean;
  data: ContentCover[];
  pagination?: PaginationInfo;
}

export interface ContentCoverDeleteResponse {
  success: boolean;
  message: string;
}

export interface UploadContentCoverResponse {
  success: boolean;
  message: string;
  data: ContentCover | ContentCover[];
  warnings?: string[];
}
