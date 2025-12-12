import { Request, Response, NextFunction } from 'express';
import redis from '../../config/redis';
import { AppError } from '../utils/AppError';
import { ApiResponse } from '../utils/ApiResponse';

export const checkIdempotency = async (req: Request, res: Response, next: NextFunction) => {
    // 1. Check for the header
    const key = req.headers['idempotency-key'];

    if (!key) {
        // For now, we allow requests without it, but in strict systems, we might require it.
        return next(); 
    }

    const redisKey = `idempotency:${key}`;

    try {
        // 2. Check Redis
        const cachedResponse = await redis.get(redisKey);

        if (cachedResponse) {
            // HIT! We already processed this.
            // Parse the stored result and return it immediately.
            const result = JSON.parse(cachedResponse);
            
            // We return the EXACT same response as before
            return ApiResponse.success(res, 'Request already processed (Cached)', result.data, result.statusCode);
        }

        // 3. Hijack the Response
        // We need to capture the response data so we can save it to Redis *after* the controller finishes.
        
        // Save the original res.json function
        const originalJson = res.json; 

        // Override res.json
        res.json = (body: any) => {
            // A. Save to Redis (Expire in 24 hours)
            // We verify 'body.success' to ensure we don't cache Errors (unless we want to).
            // Usually, we only cache successful creations (201).
            if (res.statusCode >= 200 && res.statusCode < 300) {
                 redis.set(redisKey, JSON.stringify({
                     statusCode: res.statusCode,
                     data: body.data // Assuming our standard ApiResponse structure
                 }), 'EX', 60 * 60 * 24);
            }

            // B. Call the original function to send response to user
            return originalJson.call(res, body);
        };

        next();
    } catch (error) {
        next(error);
    }
};