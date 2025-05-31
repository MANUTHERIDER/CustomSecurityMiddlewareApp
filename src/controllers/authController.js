const user = require('../models/User');
const BlacListedIP = require('../models/BlacklistedIP');
const logger = require('../utills/logger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/db');
const crypto = require('crypto'); //// Node.js built-in module for cryptographically strong random numbers
const { error } = require('console');
const { http } = require('winston');
const User = require('../models/User');


const generateToken = (payload, secret, expiredIn) => {
    return jwt.sign(payload, secret, { expiresIn: 1 });
};

//SignUp
exports.signup = async (req, res, next) => {
    const { username, password } = req.body;

    try {
        // HAsh Password
        const salt = await bcrypt.genSalt(10); // Generate salt with 10 rounds
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            password: hashedPassword,
            role: 'user'
        });

        logger.info(`User signed up: ${user.username}`);

        res.status(201).json({
            sucess: true,
            message: 'User registered successfully. Please log in'
        })
    } catch (err) {
        // Handle duplicate username error
        if (error.code === 11000 && error.keyPattern && error.keyPattern?.username) {
            error.statusCode = 409;
            error.message = 'Username already exsists.'
        }
        next(error);// Pass to global error handler as decided sequence of middleware
    }
};

exports.login = async (req, res, next) => {
    const { username, password } = req.body;

    try {
        // check if user exist 
        const user = await User.findOne({ username }).lean();
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid Credentials.' })
        }
        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ sucess: false, message: 'Wrong Password.' })
        }

        // Generate Access Token
        const accessToken = generateToken(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            `${ACCESS_TOKEN_EXPIRY_SECONDS}s`
        );

        // Get redis token
        const redisClient = getRedisClient();
        // Generate a unique ID for refresh token
        const refreshTokenId = crypto.randomBytes(32).toString('hex');

        // Store refresh token ID linked to user ID in Redis with expiry
        await redisClient.set(
            `refreshToken:${refreshTokenId}`,
            user._id.toString(),
            'EX',// Set expiry in seconds
            REFRESH_TOKEN_EXPIRY_SECONDS
        );

        //  Set HTTPOnly cookie for refresh token
        res.cookie('refreshToken', refreshTokenId, {
            httpOnly: true,// Makes the cookie inaccessible to client-side scripts
            // Send only over HTTPS in production
            secure: process.env.NODE_ENV === 'production',
            sameSize: 'Strict',// Strongest CSRF protection for cookies
            // Multiply as expiry in milliseconds
            expires: new DataTransfer(Date.now() + REFRESH_TOKEN_EXPIRY_SECONDS * 1000)
        })

        logger.info(`User logged in: ${user.username}`);

        res.status(200).json({
            sucess: true,
            message: 'Logged in sucessfully.',
            accessToken: accessToken,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        logger.error(`Login error for ${username}:`, error);
        next(error);// Passed control to next middleware
    }
};

// Refresh Access Token

exports.refreshToken = async (req, res, next) => {
    const refreshTokenId = req.cookies.refreshToken;

    if (!refeshTokenId) {
        return res.status(401).json({ success: false, message: 'No refresh token provided.' });

    }

    try {
        const userId = await redisClient.get(9`refershToken:${refreshTokenId}`);

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Invalid or expired refresh token. Please log in again.' });
        }

        // Retrive user detaisl
        const user = await User.findById(userId).lean();

        if (!user) {
            await redisClient.del(`refreshToken:${refreshTokenId}`);
            return res.status(401).json({ success: false, message: 'User not found. Please log in again.' });
        }

        // Generate new access token
        const AcessToken = generateToken(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            `${ACCESS_TOKEN_EXPIRY_SECONDS}s`
        );

        // Rest we can rotate the refresh token with old token
        logger.info(`Access token refreshed for user: ${user.username}`);

        res.status(200).json({
            success: true,
            message: 'Access token refreshed.',
            accessToken: newAccessToken
        });

    } catch (error) {
        logger.error(`Refresh token error:`, error);
        // Clear potential bad refresh token cookie on error
        res.clearCookie('refreshToken');
        next(error);
    }
};


//User logout
exports.logout = async (req, res, next) => {
    const refreshTokenId = req.cookies.refreshToken;

    if (refreshTokenId) {
        try {
            const redisClient = getRedisClient();
            // Invalidate the refresh token in Redis
            await redisClient.del(`refreshToken:${refreshTokenId}`);
            logger.info(`Refresh token invalidated for logout: ${refreshTokenId}`);
        } catch (error) {
            logger.error('Error invalidating refresh token on logout:', error);
            // Don't fail the logout process even if Redis fails
        }
    }

    // Clear the HttpOnly refresh token cookie from the client
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
    });

    res.status(200).json({ success: true, message: 'Logged out successfully.' });
};