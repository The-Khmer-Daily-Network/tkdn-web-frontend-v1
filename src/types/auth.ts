export interface User {
  id: number;
  gmail: string;
  password: string;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
  /** When API provides them (optional today) */
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

export interface UserResponse {
  success: boolean;
  data: User[];
}

export interface LoginCredentials {
  gmail: string;
  password: string;
}
