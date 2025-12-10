import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "./redis";

// Helper to create a limiter
const createLimiter = (windowMs: number, max: number, message: string) => {
    return rateLimit({
        windowMs, // Time window in milliseconds
        max,      // Max requests per IP
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        store: new RedisStore({
            // @ts-expect-error - Known issue with type definitions, pass the ioredis instance
            sendCommand: (...args: string[]) => redis.call(...args), 
        }),
        message: {
            status: 'fail',
            message: message // Send a JSON error, not text!
        },
        // ADD THIS SKIP FUNCTION:
        // If the URL matches our auth routes, skip this global limiter 
        // (because the authLimiter will handle it)
        skip: (req) => {
            return req.path.includes('/auth/login') || req.path.includes('/auth/register');
        }
    });
};

// 1. General API Limiter (Apply to all routes)
// Allow 100 requests every 15 minutes
export const apiLimiter = createLimiter(15 * 60 * 1000, 100, 'Too many requests, please try again later.');

// 2. Strict Auth Limiter (Apply to Login/Register)
// Allow 10 login attempts every hour
export const authLimiter = createLimiter(60 * 60 * 1000, 10, 'Too many login attempts, please try again in an hour.');