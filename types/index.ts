// Database types
export interface User {
  id: number;
  last_name: string;
  first_name: string;
  email: string;
  address: string;
  phone_number: string;
  is_admin: boolean;
  passw?: string; // Only for authentication
}

export interface Artwork {
  id: number;
  title: string;
  description: string;
  price: number;
  artist_name: string;
  category_id: number;
  featured: boolean;
  removed: boolean;
  created_at: Date;
  updated_at: Date;
  thumbnail_path?: string;
  other_pictures?: string[];
}

export interface Category {
  id: number;
  cname: string;
  removed: boolean;
}

export interface Review {
  id: number;
  user_id: number;
  artwork_id: number;
  rating: number;
  comment: string;
  created_at: Date;
  first_name: string;
  last_name: string;
}

export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  artwork_id: number;
  quantity: number;
  price: number;
}

export interface ShoppingCartItem {
  user_id: number;
  artwork_id: number;
  quantity: number;
}

export interface WishlistItem {
  user_id: number;
  artwork_id: number;
}

export interface Message {
  id: number;
  user_id: number;
  subject: string;
  message: string;
  is_answered: boolean;
  created_at: Date;
  answer?: string;
  answered_at?: Date;
}

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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  new_password: string;
  email: string;
}

// Configuration types
export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  name: string;
  charset: string;
}

export interface ServerConfig {
  port: number;
  clientHost: string;
}

export interface SecurityConfig {
  secretKey: string;
  sessionSecret: string;
  sessionMaxAge: number;
}

export interface EmailConfig {
  service: string;
  auth: {
    user: string;
    pass: string;
  };
}

export interface Config {
  server: ServerConfig;
  security: SecurityConfig;
  database: DatabaseConfig;
  email: EmailConfig;
}

// Express session extension
declare module "express-session" {
  interface SessionData {
    userid?: number;
    isadmin?: boolean;
  }
}

// Express Request extension
declare global {
  namespace Express {
    interface Request {
      id?: number;
      isadmin?: boolean;
    }
  }
}
