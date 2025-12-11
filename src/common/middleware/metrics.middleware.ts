import { Request, Response } from 'express';
import responseTime from 'response-time';
import { httpRequestCounter, httpRequestDuration } from '../../config/metrics';

export const metricsMiddleware = responseTime((req: Request, res: Response, time: number) => {
    // 'time' is in milliseconds, convert to seconds for Prometheus
    const durationInSeconds = time / 1000;

    // Normalize path (e.g., /api/v1/auctions/123 -> /api/v1/auctions/:id)
    // This prevents having 1000 unique labels for 1000 IDs
    // Simple regex to replace UUIDs or numbers with generic placeholders
    // (You can improve this regex based on your specific routes)
    const route = req.originalUrl.replace(/\/[0-9a-fA-F-]{36}/g, '/:id').split('?')[0]; 

    if (route !== '/metrics') { // Don't track the metrics endpoint itself
        httpRequestCounter.labels(req.method, route, res.statusCode.toString()).inc();
        httpRequestDuration.labels(req.method, route, res.statusCode.toString()).observe(durationInSeconds);
    }
});