import Stripe from 'stripe';
import { prisma } from '../../config/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-11-17.clover'
});

export const createCheckOutSession = async (auctionId: string, userId: string) => {
    // Get Auction Details
    const auction = await prisma.auction.findUnique({
        where: { id: auctionId}
    });

    if (!auction) throw new Error('Auction not found');

    // Security Check: Is the user actually the winner? (Skipping for now for simplicity)
    
    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: auction.title,
                },
                unit_amount: Number(auction.currentPrice) * 100, // Stripe expects cents!
            },
            quantity: 1,
        }],
        mode: 'payment',
        success_url: `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://localhost:3000/cancel`,
        metadata: {
            auctionId: auctionId,
            userId: userId
        }
    });

    return session.url;
}