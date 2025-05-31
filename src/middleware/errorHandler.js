const { path } = require('../app');
const logger = require('../utills/logger');

// Custiom error handler middleware

const errorHandler = (err, req, res, next) => {
    //Add in logger firl using winston logger
    logger.error(`Error: ${err.message}`, {
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack // Include stack trace
    })

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Something went wrong on the server.';

    if (err.name === 'ValidationError') {
        statusCode: 400 // Bad request
        message = err.message
    }
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode: 400 // Bad request
        message = 'Invalid ID formate.';
    }
    if (err.name === '11000') {// MongoDB duplicate key error
        statusCode: 409 //Conflicted request
        message = 'Duplicate key error: A record with this value already exists.';
    }
    if (err.name === 'JsonWebTokenError') {
        statusCode: 401 // Unauthorized
        message = 'Invalid token. Please log in again.';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode: 401 // Unauthorized
        message = 'Token expired. Please log in again.';
    }
    if (err.name === 'EBADCSRFTOKEN') {
        statusCode: 403 // Forbidden
        message = 'Invalid CSRF token.';
    }

    res.status(statusCode).json({
        sucess: false,
        message: message
    })

};

module.exports = errorHandler;