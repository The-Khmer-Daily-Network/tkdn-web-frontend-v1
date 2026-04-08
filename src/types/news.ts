export interface ContentBlock {
  subtitle: string | null;
  paragraph: string;
}

export interface EndImage {
  url: string;
  name: string | null;
}

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface News {
  id: number;
  category_id: number | null;
  author: string;
  title: string;
  cover: string | null;
  cover_name: string | null;
  subtitle: string | null;
  date_time_post: string;
  content_blocks: ContentBlock[];
  middle_image_url: string | null;
  middle_image_name: string | null;
  middle_video_url: string | null;
  middle_video_name: string | null;
  end_images: EndImage[];
  created_at: string;
  updated_at: string;
  category: Category | null;
}

export interface NewsResponse {
  success: boolean;
  data: News[];
}

export interface NewsCreateParams {
  category_id?: number | null;
  author: string;
  title: string;
  cover?: string | null;
  cover_name?: string | null;
  subtitle?: string | null;
  date_time_post?: string;
  content_blocks?: ContentBlock[];
  middle_image_url?: string | null;
  middle_image_name?: string | null;
  middle_video_url?: string | null;
  middle_video_name?: string | null;
  end_images?: EndImage[];
}

export interface NewsUpdateParams {
  category_id?: number | null;
  author?: string;
  title?: string;
  cover?: string | null;
  cover_name?: string | null;
  subtitle?: string | null;
  date_time_post?: string;
  content_blocks?: ContentBlock[];
  middle_image_url?: string | null;
  middle_image_name?: string | null;
  middle_video_url?: string | null;
  middle_video_name?: string | null;
  end_images?: EndImage[];
}

export interface NewsCreateResponse {
  success: boolean;
  message: string;
  data: News;
}

export interface NewsUpdateResponse {
  success: boolean;
  message: string;
  data: News;
}

export interface NewsDeleteResponse {
  success: boolean;
  message: string;
}
