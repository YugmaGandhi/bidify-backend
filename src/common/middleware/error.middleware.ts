import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import logger from '../../config/logger'; // <--- Ensure this is imported

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // --- CHANGE 1: Logging logic moved to the top ---
    // This ensures we log EVERYTHING, whether in Dev or Prod.
    
    if (err.statusCode >= 500) {
        // Critical Error: Log the whole error object (stack trace included)
        logger.error(err);
    } else {
        // Operational Error (4xx): Just log the message to save space
        // We don't need a stack trace for "Invalid Password"
        logger.warn(err.message);
    }

    // --- CHANGE 2: Send Response ---

    // Development: Send full details for debugging
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            stack: err.stack,
            error: err
        });
    }

    // Production: Don't leak stack traces
    if (process.env.NODE_ENV === 'production') {
        // 1. Operational, trusted error: send message to client
        if (err.isOperational) {
            return ApiResponse.error(res, err.message, err.statusCode);
        }
        
        // 2. Programming or other unknown error: don't leak details
        // Note: We already logged it via logger.error(err) at the top!
        return ApiResponse.error(res, 'Something went wrong!', 500);
    }
};