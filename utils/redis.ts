import { createClient, RedisClientType } from "redis";

class RedisCache {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private isEnabled: boolean = false;

  constructor() {
    // Check if Redis is enabled via environment variable
    this.isEnabled = process.env.ENABLE_REDIS?.toLowerCase() === "true";

    if (!this.isEnabled) {
      console.log("Redis is disabled via ENABLE_REDIS environment variable");
      return;
    }

    this.client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 60000,
      },
    });

    this.client.on("error", (err) => {
      console.error("Redis Client Error:", err);
      this.isConnected = false;
    });

    this.client.on("connect", () => {
      console.log("Connected to Redis");
      this.isConnected = true;
    });

    this.client.on("disconnect", () => {
      console.log("Disconnected from Redis");
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isEnabled || !this.client) {
      return;
    }

    try {
      if (!this.isConnected) {
        await this.client.connect();
      }
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isEnabled || !this.client) {
      return;
    }

    try {
      if (this.isConnected) {
        await this.client.quit();
      }
    } catch (error) {
      console.error("Failed to disconnect from Redis:", error);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isEnabled || !this.client) {
      return null;
    }

    try {
      if (!this.isConnected) {
        return null;
      }
      return await this.client.get(key);
    } catch (error) {
      console.error("Redis GET error:", error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      if (!this.isConnected) {
        return false;
      }

      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error("Redis SET error:", error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      if (!this.isConnected) {
        return false;
      }
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error("Redis DEL error:", error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      if (!this.isConnected) {
        return false;
      }
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error("Redis EXISTS error:", error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isEnabled || !this.client) {
      return [];
    }

    try {
      if (!this.isConnected) {
        return [];
      }
      return await this.client.keys(pattern);
    } catch (error) {
      console.error("Redis KEYS error:", error);
      return [];
    }
  }

  async flushAll(): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      if (!this.isConnected) {
        return false;
      }
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error("Redis FLUSHALL error:", error);
      return false;
    }
  }

  isHealthy(): boolean {
    return this.isEnabled && this.isConnected;
  }

  isRedisEnabled(): boolean {
    return this.isEnabled;
  }
}

const redisCache = new RedisCache();

export default redisCache;
