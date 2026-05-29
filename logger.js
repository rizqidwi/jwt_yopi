const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Buat folder logs jika belum ada
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFormat = winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] [${level.toUpperCase()}] [${message}]`;
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/app.log'),
            maxsize: 5242880,
            maxFiles: 5
        }),
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'warn',
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});

module.exports = logger;