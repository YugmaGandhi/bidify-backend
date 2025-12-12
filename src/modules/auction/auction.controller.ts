import { Request, Response } from "express";
import { createAuction, deleteAuctionById, getAuctions } from "./auction.service";
import { z } from "zod";
import { catchAsync } from "../../common/utils/catchAsync";
import { ApiResponse } from "../../common/utils/ApiResponse";

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

export const create = catchAsync(async (req: Request, res: Response) => {
    // validate input
    const data = createAuctionSchema.parse(req.body);

    const result = await createAuction({
        ...data,
        sellerId: req.user!.userId // req.user is guaranteed to exist due to auth middleware
    });

    return ApiResponse.success(res, 'Auction created successfully', result, 201);
});

export const getAll = catchAsync(async (req: Request, res: Response) => {
    // Parse query parameters
    const filters = {
        search: req.query.search as string,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10
    };

    const { items, meta } = await getAuctions(filters);
    return ApiResponse.success(res, "Auction Fetched successfully", items, 200, meta);
});


export const deleteAuction = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteAuctionById(id);

    return ApiResponse.success(res, 'Auction deleted successfully', null, 200);
})