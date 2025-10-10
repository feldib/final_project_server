// HTTP Status Codes
export const HTTP = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Server Configuration
export const SERVER = {
  DEFAULT_PORT: 3000,
  DEFAULT_SESSION_MAX_AGE: 300000, // 5 minutes in milliseconds
} as const;

// Database Configuration
export const DATABASE = {
  DEFAULT_DB_PORT: 3306,
  DEFAULT_CHARSET: "utf8mb4",
} as const;

// Cache Configuration
export const CACHE = {
  CATEGORIES_TTL: 600, // 10 minutes in seconds
  ARTWORKS_TTL: 300, // 5 minutes in seconds
} as const;

// Supported languages
export const SUPPORTED_LANGUAGES = ["en", "he", "hu"] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];
