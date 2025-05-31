const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const csrfProtection = require('csruf'({cookie:false})); // Import and initialize csrfProtection here
const {validateResult} = require('express-validator');// input validation
const logger = require('../utils/logger'); // Import logger

const validateCsrfToken = (req,res,next)=>{
    csrfProtection(req, res, (err) => {
    if(err){
         logger.warn(`CSRF token validation failed for ${req.method} ${req.originalUrl}: ${err.message}`);
            return next(err); // Pass to generic error handler
    }
    next();
    });
};

// --- Routes ---

// @route   POST /auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', validateCsrfToken, authController.signup);

// @route   POST /auth/login
// @desc    Authenticate user & get tokens
// @access  Public
router.post('/login', validateCsrfToken, authController.login);

// @route   POST /auth/refresh-token
// @desc    Get new access token using refresh token
// @access  Public (but relies on HttpOnly cookie)
router.post('/refresh-token', authController.refreshToken); // No CSRF for refresh token, as it's HttpOnly cookie based

// @route   POST /auth/logout
// @desc    Logout user & invalidate refresh token
// @access  Public (relies on HttpOnly cookie)
router.post('/logout', authController.logout); // No CSRF for logout for simplicity, as it's HttpOnly cookie based

// Example route to get CSRF token for forms/fetch requests (GET request)
router.get('/csrf-token', csrfProtection, (req, res) => {
    res.status(200).json({ csrfToken: req.csrfToken() });
});


module.exports = router;



