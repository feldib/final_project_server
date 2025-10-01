import { NextFunction, Request, Response } from "express";

import redisCache from "./redis.js";

interface CacheOptions {
  ttlSeconds?: number;
}

/**
 * Cache middleware for Express routes
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const { ttlSeconds = 300 } = options; // Default 5 minutes

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    // Generate cache key
    const cacheKey = `cache:${req.method}:${req.originalUrl}`;

    try {
      // Try to get cached response
      const cachedData = await redisCache.get(cacheKey);

      if (cachedData) {
        console.log(`Cache HIT for key: ${cacheKey}`);
        const parsed = JSON.parse(cachedData);
        return res.status(parsed.statusCode).json(parsed.data);
      }

      console.log(`Cache MISS for key: ${cacheKey}`);

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function (data: unknown): Response {
        // Cache the response
        const responseData = {
          statusCode: res.statusCode,
          data,
        };

        redisCache
          .set(cacheKey, JSON.stringify(responseData), ttlSeconds)
          .catch((err) => {
            console.error("Failed to cache response:", err);
          });

        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next(); // Continue without caching on error
    }
  };
};

/**
 * Cache invalidation helper
 */
export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisCache.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => redisCache.del(key)));
      console.log(
        `Invalidated ${keys.length} cache entries matching pattern: ${pattern}`
      );
    }
  } catch (error) {
    console.error("Cache invalidation error:", error);
  }
};

/**
 * Cache specific data with a key
 */
export const cacheData = async (
  key: string,
  data: unknown,
  ttl?: number
): Promise<void> => {
  try {
    await redisCache.set(key, JSON.stringify(data), ttl);
  } catch (error) {
    console.error("Failed to cache data:", error);
  }
};

/**
 * Get cached data by key
 */
export const getCachedData = async (key: string): Promise<unknown | null> => {
  try {
    const cached = await redisCache.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error("Failed to get cached data:", error);
    return null;
  }
};
