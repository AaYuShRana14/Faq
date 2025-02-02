const mongoose = require("mongoose");
const { redisClient } = require("../config/redis");

// Function to clear all collections
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
};

// Function to clear Redis cache
const clearCache = async () => {
  try {
    await redisClient.flushAll();
  } catch (error) {
    console.error("Error clearing cache:", error);
    // Continue without cache
  }
};

// Function to close all connections
const closeConnections = async () => {
  try {
    await mongoose.connection.close();
    await redisClient.quit();
  } catch (error) {
    console.error("Error closing connections:", error);
  }
};

module.exports = {
  clearDatabase,
  clearCache,
  closeConnections,
};
