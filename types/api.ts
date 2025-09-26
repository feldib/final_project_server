// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  address: string;
  phone_number: string;
}

export interface SearchArtworksQuery {
  min?: string;
  max?: string;
  title?: string;
  artist_name?: string;
  category_id?: string;
  order?: "price_asc" | "price_desc" | "newest" | "oldest";
  n?: string;
  offset?: string;
  only_featured?: string;
}

export interface InvoiceData {
  email: string;
  first_name: string;
  last_name: string;
  address: string;
  phone_number: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  new_password: string;
  email: string;
}

export interface StandardResponse {
  message: string;
}
