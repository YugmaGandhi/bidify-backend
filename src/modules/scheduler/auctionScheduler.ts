import cron from 'node-cron';
import { prisma } from '../../config/db';
import logger from '../../config/logger';
import { publishToQueue } from '../../config/rabbitmq';

export const initAuctionScheduler = () => {
    // Schedule : Run every minute
    // Cron Syntax: * * * * * (Minute, Hour, DayOfMonth, Month, DayOfWeek)
    cron.schedule('* * * * *', async () => {
        logger.info('Running Auction Scheduler: Checking for expired auctions..');

        try {
            const now = new Date();

            // Find all ACTIVE auctions that have passed their End Time
            const expiredAuctions = await prisma.auction.findMany({
                where: {
                    status: 'ACTIVE',
                    endTime: { lt: now } // "Less Than" now
                },
                include: {
                    bids: {
                        orderBy: { amount: 'desc'},
                        take: 1, // Get the highest bid
                        include: { user: true } // Get winner details
                    },
                    seller: true // Get seller details
                }
            });

            if (expiredAuctions.length === 0) {
                return;
            }

            logger.info(`Found ${expiredAuctions.length} expired auctions.`);

            // Process each auction
            for (const auction of expiredAuctions) {
                const winner = auction.bids[0];

                if (winner) {
                    // Scenario A: It has a winner -> SOLD
                    await prisma.auction.update({
                        where: { id: auction.id },
                        data: { status: 'SOLD' }
                    });

                    logger.info(`Auction ${auction.id} SOLD to ${winner.user.email} for ${winner.amount}`);

                    // Trigger "Auction Won" Event
                    await publishToQueue({
                        type: 'AUCTION_WON',
                        payload: {
                            auctionId: auction.id,
                            winnerId: winner.userId,
                            winnerEmail: winner.user.email,
                            amount: winner.amount,
                            sellerEmail: auction.seller.email,
                            title: auction.title
                        }
                    });

                } else {
                    // Scenario B: No Bids -> CLOSED

                    await prisma.auction.update({
                        where: { id: auction.id },
                        data: { status: 'CLOSED' }
                    });

                    logger.info(`Auction ${auction.id} CLOSED (No Bids)`);

                    await publishToQueue({
                        type: 'AUCTION_EXPIRED',
                        payload: {
                            auctionId: auction.id,
                            sellerEmail: auction.seller.email,
                            title: auction.title
                        }
                    });
                }
            }
        } catch (err) {
            logger.error('Error in Auction Scheduler:', err);
        }
    });
};