const winston = require('winston')

//Define the log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(info => {
        if (info.stack) {
            return `${info.timestamp} ${info.level} ${info.message}\n${info.stack}`;
        } else {
            return `${info.timestamp} ${info.level} ${info.message}`;
        }
    })
);

//create the logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', // log info only in prod env
    format: logFormat,
    transports: [
        // Console Transport (for development visibility)

        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(), //Add color for console output
                logFormat
            )
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, //5mb
            maxFiles: 5,  // 5 files only
            level: 'info'  // Only 'info' level and above in this file
        }),
        // File Transport for all logs (info, warn, error, debug etc.)
        new winston.transports.File({
            filename: 'logs/error.log', // error goes here
            maxsize: 5242880, //5mb
            maxFiles: 5, //Keep 5 files
            level: 'error' // Only 'error' level and above in this file
        })
    ]

});

module.exports = logger;
