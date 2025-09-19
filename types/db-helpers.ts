import { Artwork, Tag } from "./database.js";

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
