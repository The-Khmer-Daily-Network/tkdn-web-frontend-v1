export interface AdvertisementImage {
  id: number;
  image_url: string;
  position: string;
  created_at: string;
  updated_at: string;
}

export interface AdvertisementImageResponse {
  success: boolean;
  data: AdvertisementImage[];
}

export interface AdvertisementImageUploadParams {
  image: File;
  position: string;
}

export interface AdvertisementImageUploadResponse {
  success: boolean;
  message: string;
  data: AdvertisementImage;
}

export interface AdvertisementImageDeleteResponse {
  success: boolean;
  message: string;
}

export interface Advertisement {
  id: number;
  name: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdvertisementResponse {
  success: boolean;
  data: Advertisement[];
}

export interface AdvertisementCreateParams {
  name: string;
  image_url: string | null;
}

export interface AdvertisementUpdateParams {
  name?: string;
  image_url?: string | null;
}

export interface AdvertisementCreateResponse {
  success: boolean;
  message: string;
  data: Advertisement;
}

export interface AdvertisementUpdateResponse {
  success: boolean;
  message: string;
  data: Advertisement;
}

export interface AdvertisementDeleteResponse {
  success: boolean;
  message: string;
}
