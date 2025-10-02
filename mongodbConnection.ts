import mongoose from "mongoose";

import config from "./config.js";

export const connectToMongoDB = async (): Promise<void> => {
  // If already connected, don't connect again
  if (mongoose.connection.readyState === 1) {
    console.log("Already connected to MongoDB");
    return;
  }

  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(config.mongodb.url, {
      maxPoolSize: 3,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      bufferCommands: false,
    });

    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

export const disconnectFromMongoDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

export const isMongoConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export default { connectToMongoDB, disconnectFromMongoDB, isMongoConnected };
