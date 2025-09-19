export interface Tag {
  id: number;
  tname: string;
}

export interface ArtworkWithDetails extends Artwork {
  thumbnail?: string;
  cname?: string;
  tags?: Tag[];
  other_pictures?: string[];
}

export interface OrderDataItem {
  cost: number;
  category_id: number;
  price: number;
  quantity: number;
  id: number;
  title: string;
  artist_name: string;
  user_name: string;
  user_id: number;
  thumbnail?: string;
  cname?: string;
  tags?: Tag[];
}

export interface OrderDataCollection {
  time_ordered: number;
  totalCost: number;
  items: OrderDataItem[];
  user?: {
    user_name: string;
    user_id: number;
  };
}

// API Response types
export interface StandardResponse {
  message: string;
}

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

// DB API types - shared types and interfaces used across multiple database API files
export type UserField =
  | "first_name"
  | "last_name"
  | "email"
  | "address"
  | "phone_number";

export type ArtworkField =
  | "title"
  | "artist_name"
  | "price"
  | "quantity"
  | "description"
  | "category_id"
  | "tags";

export interface NewArtwork {
  title: string;
  artist_name: string;
  price: number;
  quantity: number;
  description: string;
  category_id: number;
  tags: string[];
  thumbnail: string;
  other_pictures: string[];
}

// Express session extension
declare module "express-session" {
  interface SessionData {
    userid?: number;
    isadmin?: boolean;
  }
}

// Express Request extension
declare module "express-serve-static-core" {
  interface Request {
    id?: number;
    isadmin?: boolean;
  }
}
