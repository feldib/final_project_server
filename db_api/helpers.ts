import fs from "fs/promises";
import { RowDataPacket } from "mysql2/promise";

import {
  CategoryTranslation,
  LanguageCode,
} from "../mongodb/CategoryTranslationModel.js";
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
): Promise<{ [key in LanguageCode]?: string } | null> => {
  // First check if the category exists in the SQL database
  const connection = await makeConnection();
  const [categories] = await connection.query<RowDataPacket[]>(
    "SELECT id FROM categories WHERE id = ? AND removed = false",
    [category_id]
  );
  connection.end();

  if (categories.length === 0) {
    return null;
  }

  // Get translations from MongoDB
  const translations = await CategoryTranslation.find({
    categoryId: category_id,
  });

  if (translations.length === 0) {
    return {};
  }

  // Convert to the expected format
  const result: { [key in LanguageCode]?: string } = {};
  translations.forEach((translation) => {
    result[translation.languageCode] = translation.name;
  });

  return result;
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
  const categoryTranslations = await getSpecificCategory(artwork.category_id);
  const tags = await getSpecificTags(artwork.id);
  artwork.thumbnail = thumbnail;
  artwork.category = { translations: categoryTranslations || {} };
  artwork.tags = tags;
};

// Helper function to add only thumbnail (for functions without category_id)
export const addThumbnail = async (
  artwork: RowDataPacket | ArtworkWithDetails
): Promise<void> => {
  const thumbnail = await getThumbnail(artwork.id);
  artwork.thumbnail = thumbnail;
};
