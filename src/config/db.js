const mongoose = require('mongoose');
const redis = require('redis');
const logger = require('../utills/logger')


let redisClient;
//Setup MongoDB connection
const connectMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('MongoDb connected successfully');
    } catch (error) {
        logger.error('MongoDb connection failed: ', error);
        process.exit(1); //Exit process with failure code
    }
};

const connectRedis = async () => {
    try {
        redisClient = redis.createClient({
            url: process.env.REDIS_URI
        });

        redisClient.on('error', (err) => logger.error('Redis Client Error :', err));
        redisClient.on('connect', () => logger.info('Redis connected successfully'));
    } catch (error) {
        logger.error('Redis connection failed:', error);
        process.exit(1);
    }
};

module.exports = {
    connectMongoDB,
    connectRedis,
    getRedisclient: () => redisClient // Export a getter for the connected client
}