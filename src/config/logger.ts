import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // Print stack trace
    winston.format.splat(),
    winston.format.json() // Production format (easier to parse)
);

// Define where to store logs
const logDir = 'logs';

// Create the Logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        // 1. Write all logs with level 'error' and below to error-%DATE%.log
        new DailyRotateFile({
            dirname: logDir,
            filename: 'error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true, // Compress old logs to save space
            maxSize: '20m',      // Rotate if file size exceeds 20MB
            maxFiles: '14d',     // Keep logs for 14 days
            level: 'error',
        }),
        // 2. Write all logs with level 'info' and below to combined-%DATE%.log
        new DailyRotateFile({
            dirname: logDir,
            filename: 'combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
        }),
    ],
});

// If we're not in production then log to the `console` with simple format
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple() // Simple text format for local dev
        ),
    }));
}

// Create a stream object (used by Morgan for HTTP request logging later)
export const stream = {
    write: (message: string) => {
        logger.info(message.trim());
    },
};

export default logger;