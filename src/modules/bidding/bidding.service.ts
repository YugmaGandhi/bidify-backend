import { prisma } from "../../config/db";
import { Prisma } from "@prisma/client";
import { getIO } from "../../socket";

interface PlaceBidInput {
    auctionId: string;
    userId: string;
    amount: number;
}

export const placeBid = async (input: PlaceBidInput) => {
    const { auctionId, userId, amount } = input;

    // Fetch the auction ( we need to check its status)
    const auction = await prisma.auction.findUnique({
        where: { id: auctionId }
    });

    if(!auction) {
        throw new Error('Auction not found');
    }

    // Business logic Validation

    //Rule A: Cannot bid on your own item
    if ( auction.sellerId === userId) {
        throw new Error("You cannot bid on your own auction");
    }

    //Rule B: Auction must be active (Time Check)
    const now = new Date();
    if (now < auction.startTime) {
        throw new Error("Auction has not started yet");
    }
    if (now > auction.endTime) {
        throw new Error("Auction has already ended");
    }

    // Rule C: Bid must be higher than current price
    // Note: We Compare Decimals properly
    if (new Prisma.Decimal(amount).lessThanOrEqualTo(auction.currentPrice)) {
        throw new Error(`Bid must be higher than current price: ${auction.currentPrice}`)
    };

    // The Transaction (Atomicity)
    // We execute multiple DB operations together
    const result = await prisma.$transaction(async (tx) => {
        // A. Create the Bid
        const newBid = await tx.bid.create({
            data: {
                amount: new Prisma.Decimal(amount),
                userId: userId,
                auctionId: auctionId
            },
            include: {
                user: { select: { name: true }}
            }
        });

        await tx.auction.update({
            where: { id: auctionId },
            data: { currentPrice: new Prisma.Decimal(amount) }
        });

        return newBid;
    });

    // REAL-TIME BROADCAST
    // We emit to the specific room: "auction_{id}"
    const io = getIO();
    io.to(input.auctionId).emit('bid_update', {
        auctionId: input.auctionId,
        amount: input.amount,
        bidderName: result.user.name,
        timeStamp: new Date()
    });

    return result;
};