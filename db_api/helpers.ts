import fs from "fs/promises";
import { RowDataPacket } from "mysql2/promise";

import makeConnection from "../mysqlConnection.js";
import { Tag } from "../types/database.js";
import { ArtworkWithDetails } from "../types/db-helpers.js";

// Helper functions used by multiple files

export const getThumbnail = async (artwork_id: number): Promise<string> => {
  const path = `images/${artwork_id}/thumbnail`;

  const files = await fs.readdir(`public/${path}`).catch(() => {
    return undefined;
  });

  const file_name = files ? files[0] : "";

  return `${path}/${file_name}`;
};

export const getSpecificCategory = async (
  category_id: number
): Promise<{ cname_en: string; cname_he: string; cname_hu: string } | null> => {
  const connection = await makeConnection();
  const [categories] = await connection.query<RowDataPacket[]>(
    "SELECT cname_en, cname_he, cname_hu FROM categories WHERE id = ?",
    [category_id]
  );
  connection.end();
  return (
    (categories[0] as {
      cname_en: string;
      cname_he: string;
      cname_hu: string;
    }) || null
  );
};

export const getSpecificTags = async (artwork_id: number): Promise<Tag[]> => {
  const connection = await makeConnection();
  const [tags] = await connection.query<RowDataPacket[]>(
    `
    SELECT tags.id, tags.tname FROM tags LEFT JOIN artwork_tags 
    ON tags.id = artwork_tags.tag_id
    WHERE artwork_tags.artwork_id = ? AND artwork_tags.removed = false AND tags.removed = false
  `,
    [artwork_id]
  );
  connection.end();
  return tags as Tag[];
};

// Helper function to enhance artwork with thumbnail, category, and tags
export const completeArtwork = async (
  artwork: RowDataPacket | ArtworkWithDetails
): Promise<void> => {
  const thumbnail = await getThumbnail(artwork.id);
  const category = await getSpecificCategory(artwork.category_id);
  const tags = await getSpecificTags(artwork.id);
  artwork.thumbnail = thumbnail;
  artwork.category = category;
  artwork.tags = tags;
};

// Helper function to add only thumbnail (for functions without category_id)
export const addThumbnail = async (
  artwork: RowDataPacket | ArtworkWithDetails
): Promise<void> => {
  const thumbnail = await getThumbnail(artwork.id);
  artwork.thumbnail = thumbnail;
};
