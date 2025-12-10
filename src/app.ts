import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './modules/auth/auth.route';
import auctionRoutes from './modules/auction/auction.routes';
import biddingRoutes from './modules/bidding/bidding.routes';
import paymentRoutes from './modules/payment/payment.routes';
import uploadRoutes from './modules/upload/upload.routes';
import { AppError } from './common/utils/AppError';
import { globalErrorHandler } from './common/middleware/error.middleware';

const app: Application = express();

// Global Middlewares
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS

// --- CRITICAL CHANGE START ---

// 1. Mount Payment Routes FIRST (Specifically for the Webhook)
// We need the raw body for the webhook, so we handle it inside payment.routes.ts or here.
// But to keep it clean, let's use a specific parser just for the webhook route.

// We will NOT use app.use(express.json()) globally yet.

// 2. Define the Webhook Route directly here or via a special middleware
// Ideally, we move the webhook route to a separate file that uses express.raw()
// But for this Monolith, let's use this trick:

// Parse raw body ONLY for the webhook path
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json()); // Parse JSON bodies

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auctions', auctionRoutes);
app.use('/api/v1/bids', biddingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/upload', uploadRoutes);

// 404 Handler ( If route not found)
app.all('/{*any}', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

export default app;
