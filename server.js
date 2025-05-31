require('dotenv').config();

const app = require('./src/app');
const logger = require('./src/utills/logger');

const PORT = process.env.PORT || 3000;

// Catches unhandled promise rejections
process.on('unhandledRejection',(reason,promise)=>{
     logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Catches uncaught synchronous exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Perform graceful shutdown (e.g., close DB connections)
    // For uncaught exceptions, always exit, as the application state is corrupted
    process.exit(1);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
})