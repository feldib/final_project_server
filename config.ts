import dotenv from "dotenv";
import { Config } from "./types/index.js";

// Load environment variables from .env file
dotenv.config();

const config: Config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || "3000"),
    clientHost: process.env.CLIENT_HOST || "",
  },

  // Security configuration
  security: {
    secretKey: process.env.SECRET_KEY || "",
    sessionSecret: process.env.SESSION_SECRET || "",
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || "300000"), // 5 minutes default
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "ecommerce",
    charset: process.env.DB_CHARSET || "utf8mb4",
  },

  // Email service configuration
  email: {
    service: process.env.TRANSPORTER_SERVICE || "gmail",
    auth: {
      user: process.env.TRANSPORTER_AUTH_USER || "",
      pass: process.env.TRANSPORTER_AUTH_PASS || "",
    },
  },
};

export default config;
