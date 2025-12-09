import { Request, Response } from "express";
import { createAuction, getAuctions } from "./auction.service";
import { z } from "zod";

const createAuctionSchema = z.object({
    title: z.string().min(3),
    description: z.string(),
    startingPrice: z.number().positive(),
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    imageUrl: z.url()
}).refine((data) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    return end > start;
}, {
    message: "End time must be after start time",
    path: ["endTime"]
});

export const create = async ( req: Request, res: Response) => {
    try {
        // validate input
        const data = createAuctionSchema.parse(req.body);

        const result = await createAuction({
            ...data,
            sellerId: req.user!.userId // req.user is guaranteed to exist due to auth middleware
        });

        res.status(201).json({ message: 'Auction created successfully', data: result });
    } catch ( error: any) {
        res.status(400).json({ message: error.message || 'Error creating auction', errors: error.errors});
    }
};

export const getAll = async ( req: Request, res: Response) => {
    try {
        const auctions = await getAuctions();
        res.status(200).json({ data: auctions });
    } catch (error: any) {
        res.status(500).json({ message: 'Server error' });
    }
}