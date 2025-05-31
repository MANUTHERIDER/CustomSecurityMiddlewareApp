const express = require('express');
const { connectMongoDB, connectRedis } = require('./config/db')
const logger = require('./utills/logger');

const app = express();
// Middleware to parse json
app.use(express.json());

// Connect to MongoDB and Redis
const initializeConnections = async () => {
    await connectMongoDB();
    await connectRedis(); // Also set the global redisClient in db.js
};

//Making connection immediately 
initializeConnections().catch(error => {
    logger.error('Failed in intialize database connections :', error);
    process.exit(1);
})


app.get('/', (req, res) => {
    res.send('Welcome to the Secure Express App!');
})

module.exports = app