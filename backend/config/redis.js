const { createClient } = require("redis");
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});
redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.on("connect", () => console.log("Connected to Redis"));

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error("Redis connection error:", error);
    // Add graceful fallback
    console.log("Running without Redis cache");
  }
};

// Cache duration in seconds
const CACHE_DURATION = 3600; // 1 hour

// Generate cache key for FAQs
const getFaqCacheKey = (lang, page, limit) => {
  return `faqs:${lang}:${page}:${limit}`;
};

// Clear all FAQ-related caches
const clearFaqCache = async () => {
  try {
    const keys = await redisClient.keys("faqs:*");
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error("Error clearing FAQ cache:", error);
  }
};

module.exports = {
  redisClient,
  connectRedis,
  CACHE_DURATION,
  getFaqCacheKey,
  clearFaqCache,
};
