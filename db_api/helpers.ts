import { RowDataPacket } from "mysql2/promise";
import fs from "fs/promises";
import makeConnection from "../connection.js";
import { ArtworkWithDetails, Tag } from "../types/index.js";

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
): Promise<string> => {
  const connection = await makeConnection();
  const [categories] = await connection.query<RowDataPacket[]>(
    "SELECT cname FROM categories WHERE id = ?",
    [category_id]
  );
  connection.end();
  return categories[0]?.cname || "";
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

// Helper function to enhance artwork with thumbnail, category name, and tags
export const completeArtwork = async (
  artwork: RowDataPacket | ArtworkWithDetails
): Promise<void> => {
  const thumbnail = await getThumbnail(artwork.id);
  const cname = await getSpecificCategory(artwork.category_id);
  const tags = await getSpecificTags(artwork.id);
  artwork.thumbnail = thumbnail;
  artwork.cname = cname;
  artwork.tags = tags;
};

// Helper function to add only thumbnail (for functions without category_id)
export const addThumbnail = async (
  artwork: RowDataPacket | ArtworkWithDetails
): Promise<void> => {
  const thumbnail = await getThumbnail(artwork.id);
  artwork.thumbnail = thumbnail;
};
