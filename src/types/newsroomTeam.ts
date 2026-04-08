export interface NewsroomTeamImage {
  id: number;
  image_url: string;
  name: string;
  original_name: string;
  created_at: string;
  updated_at: string;
}

export interface NewsroomTeamImageResponse {
  success: boolean;
  data: NewsroomTeamImage[];
}

export interface NewsroomTeamImageUploadResponse {
  success: boolean;
  message: string;
  data: NewsroomTeamImage | NewsroomTeamImage[];
  warnings?: string[];
}

export interface NewsroomTeam {
  id: number;
  first_name: string;
  last_name: string;
  image_url: string | null;
  position: string;
  created_at: string;
  updated_at: string;
}

export interface NewsroomTeamResponse {
  success: boolean;
  data: NewsroomTeam[];
}

export interface NewsroomTeamCreateParams {
  first_name: string;
  last_name: string;
  image_url: string | null;
  position: string;
}

export interface NewsroomTeamUpdateParams {
  first_name?: string;
  last_name?: string;
  image_url?: string | null;
  position?: string;
}

export interface NewsroomTeamCreateResponse {
  success: boolean;
  message: string;
  data: NewsroomTeam;
}

export interface NewsroomTeamUpdateResponse {
  success: boolean;
  message: string;
  data: NewsroomTeam;
}

export interface NewsroomTeamDeleteResponse {
  success: boolean;
  message: string;
}
