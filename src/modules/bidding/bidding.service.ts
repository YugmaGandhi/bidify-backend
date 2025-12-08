import redis from "../../config/redis";
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

    // --- STEP 1: FAIL FAST (Redis Strategy) ---
    // If we know the price is too low from Cache, reject it instantly.
    // We don't even bother checking the DB for time/seller yet.
    const cachedPrice = await redis.get(`auction:${auctionId}:price`);

    if (cachedPrice) {
        if (new Prisma.Decimal(amount).lessThanOrEqualTo(new Prisma.Decimal(cachedPrice))) {
            throw new Error(`Bid must be higher than current price: ${cachedPrice}`);
        }
    }

    // --- STEP 2: FETCH DATA (The Single Source of Truth) ---
    // We passed the cache check, but we still need to check:
    // 1. Does auction exist?
    // 2. Is user the seller?
    // 3. Is time valid?
    const auction = await prisma.auction.findUnique({
        where: { id: auctionId }
    });

    if (!auction) {
        throw new Error('Auction not found');
    }

    // --- STEP 3: SELF-HEALING CACHE ---
    // If Redis was empty (Cache Miss), we fix it now so the next user hits the cache.
    if (!cachedPrice) {
        await redis.set(`auction:${auctionId}:price`, auction.currentPrice.toString());
    }

    // --- STEP 4: BUSINESS RULES ---
    
    // Rule A: Self-bidding
    if (auction.sellerId === userId) {
        throw new Error("You cannot bid on your own auction");
    }

    // Rule B: Time Check
    const now = new Date();
    if (now < auction.startTime) throw new Error("Auction has not started yet");
    if (now > auction.endTime) throw new Error("Auction has ended");

    // Rule C: DB Price Check (Double Safety)
    // We check again just in case Redis was slightly stale compared to DB (race condition safety)
    if (new Prisma.Decimal(amount).lessThanOrEqualTo(auction.currentPrice)) {
        throw new Error(`Bid must be higher than current price: ${auction.currentPrice}`);
    }

    // --- STEP 5: TRANSACTION ---
    const result = await prisma.$transaction(async (tx) => {
        const newBid = await tx.bid.create({
            data: {
                amount: new Prisma.Decimal(amount),
                userId: userId,
                auctionId: auctionId
            },
            include: {
                user: { select: { name: true } }
            }
        });

        await tx.auction.update({
            where: { id: auctionId },
            data: { currentPrice: new Prisma.Decimal(amount) }
        });

        return newBid;
    });

    // --- STEP 6: UPDATE INFRASTRUCTURE ---
    
    // Update Redis
    await redis.set(`auction:${auctionId}:price`, amount.toString());

    // Broadcast via Socket.IO
    const io = getIO();
    io.to(auctionId).emit('bid_update', {
        auctionId: auctionId,
        amount: amount,
        bidderName: result.user.name,
        timestamp: new Date()
    });

    return result;
};