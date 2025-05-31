const express = require('express');
const app = express();
const { connectMongoDB, connectRedis, getRedisclient } = require('./config/db')
const logger = require('./utills/logger');

//Security Middleware Imports
const helmet = require('helmet'); //sets various HTTP headers
const rateLimit = require('express-rate-Limit'); //Limit number of API calls in given time
const RedisStore = require('rate-limit-redis'); // Redis store for rate limiter
const xss = require('xss-clean'); //Sanitizes input against XSS
const session = require('express-session'); // Session managment (for csurf)
const csurf = require('csurf'); //CSRF protection

// custom middleware imports
const inputSanitizer = require('./middleware/inputSanitizer');  // custom input sanitizer
const errorHandler = require('./middleware/errorHandler');


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

// All security middlewares 

app.use(helmet()); // Early as adding security headers
app.use(express.json()); // Used to parse json
app.use(xss()); //XSS clean middleware
app.use(inputSanitizer); // Custom sanitizer

// Preventing brute-force by rate limiter
const redisClient = getRedisclient(); // getting redis client bye the getter so to avoid unussual connections

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minute
    max: 100, // Limit each IP to 100 request per windowMs window
    message: { status: 429, message: 'Too many requests, please try again 15 minutes.' },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({ // use redis to store hit count
        sendCommand: (...args) => redisClient.sendCommand(...args),
    }),
});
app.use(apiLimiter); //App rate limiting to all requests

//Session mangment for CSURF
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUnintialized: true,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'Lax'
    }
}));

//CSURF Protection
const csrufProtection = csurf({ cookie: fasle });

// Route handler
const authRoutes = require('./routes/auth');

app.use('/auth', authRoutes);



app.get('/', (req, res) => {
    res.send('Welcome to the Secure Express App!');
})


//Error handling middleware
app.use(errorHandler); //Custom error handler
module.exports = app