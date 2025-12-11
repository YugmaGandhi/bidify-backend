import client from 'prom-client';

// 1. Create a Registry (The folder where metrics are stored)
export const register = new client.Registry();

// 2. Add default metrics (CPU, RAM, Event Loop Lag)
client.collectDefaultMetrics({ register });

// 3. Create Custom Metrics

// A. Counter: Counts things that only go up (e.g., Total Requests)
export const httpRequestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

// B. Histogram: Tracks distribution of values (e.g., Duration)
// "How many requests took < 100ms? How many < 500ms?"
export const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5], // Buckets for 100ms, 500ms, 1s, etc.
    registers: [register]
});