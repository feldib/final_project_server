import mongoose, { Document, Schema } from "mongoose";

// Supported languages
export const SUPPORTED_LANGUAGES = ["en", "he", "hu"] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

// Category Translation Interface
export interface CategoryTranslationInterface extends Document {
  categoryId: number;
  languageCode: LanguageCode;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Category Translation Schema
const categoryTranslationSchema = new Schema<CategoryTranslationInterface>(
  {
    categoryId: {
      type: Number,
      required: true,
      index: true,
    },
    languageCode: {
      type: String,
      required: true,
      enum: SUPPORTED_LANGUAGES,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
categoryTranslationSchema.index(
  { categoryId: 1, languageCode: 1 },
  { unique: true }
);

// Export the model
export const CategoryTranslation = mongoose.model<CategoryTranslationInterface>(
  "CategoryTranslation",
  categoryTranslationSchema
);
