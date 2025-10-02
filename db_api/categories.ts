import { RowDataPacket } from "mysql2/promise";

import {
  CategoryTranslation,
  CategoryTranslationInterface,
  LanguageCode,
} from "../mongodb/CategoryTranslationModel.js";
import makeConnection from "../mysqlConnection.js";

// Interface for category with translations
export interface CategoryWithTranslations {
  id: number;
  removed: boolean;
  translations: { [key in LanguageCode]?: string };
}

export const getAllCategories = async (): Promise<RowDataPacket[]> => {
  const connection = await makeConnection();
  const [categories] = await connection.query<RowDataPacket[]>(
    "SELECT id FROM categories WHERE removed = false;"
  );
  connection.end();
  return categories;
};

export const getAllCategoriesWithTranslations = async (): Promise<
  CategoryWithTranslations[]
> => {
  // Get categories from SQL
  const sqlCategories = await getAllCategories();

  // Get all translations from MongoDB (connection already established)
  const allTranslations = await CategoryTranslation.find({}).sort({
    categoryId: 1,
  });

  // Combine SQL categories with MongoDB translations
  const categoriesWithTranslations: CategoryWithTranslations[] =
    sqlCategories.map((category) => {
      const categoryTranslations = allTranslations.filter(
        (translation: CategoryTranslationInterface) =>
          translation.categoryId === category.id
      );

      const translations: { [key in LanguageCode]?: string } = {};
      categoryTranslations.forEach(
        (translation: CategoryTranslationInterface) => {
          translations[translation.languageCode] = translation.name;
        }
      );

      return {
        id: category.id,
        removed: category.removed || false,
        translations,
      };
    });

  return categoriesWithTranslations;
};
