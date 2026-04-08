export interface Publisher {
  id: number;
  first_name: string;
  last_name: string;
  nickname: string;
  gmail: string;
  sme: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublisherResponse {
  success: boolean;
  data: Publisher[];
}

export interface PublisherCreateParams {
  first_name: string;
  last_name: string;
  nickname: string;
  gmail: string;
  sme?: boolean;
}

export interface PublisherUpdateParams {
  first_name?: string;
  last_name?: string;
  nickname?: string;
  gmail?: string;
  sme?: boolean;
}

export interface PublisherCreateResponse {
  success: boolean;
  message: string;
  data: Publisher;
}

export interface PublisherUpdateResponse {
  success: boolean;
  message: string;
  data: Publisher;
}

export interface PublisherDeleteResponse {
  success: boolean;
  message: string;
}
