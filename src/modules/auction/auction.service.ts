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

export const getAuctions = async () => {
    return await prisma.auction.findMany({
        where: {
            // Only show active or upcoming auctions?
            // For now, let's fetch all to test easily.
        },
        include: {
            seller: {
                select: { name: true, email: true } // Don't send password!
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
}