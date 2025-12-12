import { AppError } from "../../common/utils/AppError";
import { prisma } from "../../config/db";
import { Prisma } from "@prisma/client";

interface CreateAuctionInput {
    title: string;
    description: string;
    startingPrice: number;
    startTime: string;
    endTime: string;
    sellerId: string;
    imageUrl: string;
}

interface AuctionFilters {
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
}

export const createAuction = async (input: CreateAuctionInput) => {
    return await prisma.auction.create({
        data: {
            title: input.title,
            description: input.description,
            startingPrice: new Prisma.Decimal(input.startingPrice), // Convert number to Decimal
            currentPrice: new Prisma.Decimal(input.startingPrice),  // Current price starts at start price
            startTime: new Date(input.startTime),
            endTime: new Date(input.endTime),
            sellerId: input.sellerId,
            imageUrl: input.imageUrl
        }
    });
}

export const getAuctions = async (filters: AuctionFilters) => {
    // Destructure with Defaults
    // If page is undefined, default to 1. If limit is undefined, default to 10
    const { search, minPrice, maxPrice, page = 1, limit= 10 } = filters;

    // Pagination logic ( The "Skip")
    // If page is 1 then skip 0, if page is 2 skip 10
    const skip = (page - 1) * limit;

    //Build the "Where" Clause Dynamically
    const whereClause: any = {};
    
    // Search Partial match
    if (search) {
        whereClause.OR = [
            // Search in Title OR Description
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
        ];
    }
    // Logic B: Price Range
    // We check if either min or max exists before adding the rule
    if (minPrice || maxPrice) {
        whereClause.currentPrice = {}; // Initialize the price rule object
        if (minPrice) whereClause.currentPrice.gte = minPrice; // Greater Than or Equal
        if (maxPrice) whereClause.currentPrice.lte = maxPrice; // Less Than or Equal
    }

    // Logic C: Active Auctions Only (Optional but recommended)
    // We usually only want to show auctions that haven't ended yet
    const now = new Date();
    whereClause.endTime = { gt: now }; 

    // 5. Execute the Query
    const auctions = await prisma.auction.findMany({
        where: whereClause, // Inject our dynamic object here
        skip: skip,         // Skip the first X records
        take: limit,        // Take only Y records
        orderBy: { createdAt: 'desc' }, // Show newest first
        include: {
            seller: { select: { name: true, email: true } } // Join with Seller table
        }
    });

    // 6. Get Total Count (For Frontend Pagination UI)
    // We need to know the total matching items to calculate "Total Pages"
    const total = await prisma.auction.count({ where: whereClause });

    return {
        items: auctions,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) // e.g., 25 items / 10 limit = 3 pages
        }
    };
}

export const deleteAuctionById = async (auctionId: string) => {
    // Check if it exists first
    const auction = await prisma.auction.findUnique({ where: { id: auctionId }});
    if (!auction) {
        throw new AppError("Auction not Found", 404);
    }

    // TODO: Convert this to solft Delete
    // Delete it
    // Note: If you have Foreign Keys (Bids), this might fail unless you set onDelete: Cascade in schema
    // OR delete related bids first within a transaction.
    return await prisma.auction.delete({
        where: { id: auctionId }
    });
}