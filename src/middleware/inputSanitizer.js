// It uses mongo sanitize to clean request bodies and queries

const sanitizeMongo = require('mongo-sanitize');
const logger = require('../utills/logger');


const inputSanitizer = (req, res, next) => {
    // For POST/PUT request
    if (req.body) {
        req.body = sanitizeMongo(req.body);
        logger.debug('req.body sanitized.');

    }
    // For GET request with query
    if (req.query) {
        req.query = sanitizeMongo(req.query);
        logger.debug('req.query sanitized.');
    }
    // URL Parameters
    if (req.params) {
        req.params = sanitizeMongo(req.params);
        logger.debug('req.params sanitized.');
    }

    next(); //pass control to next middleware


}

module.exports = inputSanitizer;