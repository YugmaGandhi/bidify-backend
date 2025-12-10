import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Development: Send full stack trace
    if (process.env.NODE_ENV === 'development') {
        console.error('ERROR 💥', err); // We will replace this with Winston later
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
            stack: err.stack,
            error: err
        });
    }

    // Production: Don't leak stack traces to the user!
    if (process.env.NODE_ENV === 'production') {
        // 1. Operational, trusted error: send message to client
        if (err.isOperational) {
            return ApiResponse.error(res, err.message, err.statusCode);
        }
        
        // 2. Programming or other unknown error: don't leak details
        console.error('ERROR 💥', err);
        return ApiResponse.error(res, 'Something went wrong!', 500);
    }
};