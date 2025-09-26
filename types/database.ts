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
export interface Tag {
  id: number;
  tname: string;
}
