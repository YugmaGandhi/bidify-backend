import { Request, Response } from 'express';
import { placeBid } from './bidding.service';
import { z } from 'zod';

const bidSchema = z.object({
    auctionId: z.uuid(),
    amount: z.number().positive(),
});

export const createBid = async (req: Request, res: Response) => {
    try {
        const data = bidSchema.parse(req.body);

        const result = await placeBid({
            auctionId: data.auctionId,
            userId: req.user!.userId, // From Auth Middleware
            amount: data.amount
        });

        res.status(201).json({ message: 'Bid placed successfully', data: result });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Error placing bid' });
    }
};