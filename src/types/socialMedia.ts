export interface SocialMedia {
  id: number;
  name: string;
  link: string;
  created_at?: string;
  updated_at?: string;
}

export interface SocialMediaResponse {
  success: boolean;
  data: SocialMedia[];
}
