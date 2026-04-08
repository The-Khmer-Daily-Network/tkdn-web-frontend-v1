export interface SubCategory {
  id: number;
  name: string;
  parent_id: number;
}

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  subcategories: SubCategory[];
}

export interface CategoryResponse {
  success: boolean;
  categories: Category[];
}

export interface CategoryCreateParams {
  name: string;
  parent_id: number | null;
}

export interface CategoryUpdateParams {
  name?: string;
  parent_id?: number | null;
}

export interface CategoryCreateResponse {
  success: boolean;
  message: string;
  data: Category;
}

export interface CategoryUpdateResponse {
  success: boolean;
  message: string;
  data: Category;
}

export interface CategoryDeleteResponse {
  success: boolean;
  message: string;
}
