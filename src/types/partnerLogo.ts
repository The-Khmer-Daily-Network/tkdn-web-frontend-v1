export interface PartnerLogoImage {
  id: number;
  image_url: string;
  name: string;
  original_name: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerLogoImageResponse {
  success: boolean;
  data: PartnerLogoImage[];
}

export interface PartnerLogoImageUploadParams {
  image: File;
  name?: string;
}

export interface PartnerLogoImageUploadResponse {
  success: boolean;
  message: string;
  data: PartnerLogoImage | PartnerLogoImage[];
  warnings?: string[];
}

export interface PartnerLogoImageDeleteResponse {
  success: boolean;
  message: string;
}
