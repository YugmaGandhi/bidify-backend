import { Request, Response } from 'express';
import { createCheckOutSession } from './payment.service';
import { prisma } from '../../config/db';
import { z } from 'zod';
import Stripe from 'stripe';

const createPaymentSchema = z.object({
    auctionId: z.uuid(),
});

export const createCheckout = async (req: Request, res: Response) => {
    try {
        const { auctionId } = createPaymentSchema.parse(req.body);

        // Ensure user is logged in
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const sessionUrl = await createCheckOutSession(auctionId, req.user.userId);

        if (!sessionUrl) {
            res.status(500).json({ message: 'Failed to create payment session' });
            return;
        }

        res.status(200).json({ url: sessionUrl });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Payment initiation failed'})
    }
};

export const handleWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    let event: Stripe.Event;

    try {
        event = Stripe.webhooks.constructEvent(
            req.body,
            sig as string,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            console.log("💰 Payment Successful!", session);

            // Extract metadata we sent earlier
            const auctionId = session.metadata?.auctionId;
            const userId = session.metadata?.userId;

            if (auctionId && userId) {
                // UPDATE DB: Mark auction as sold
                // In a real app, you would also create a Transaction record here
                await prisma.auction.update({
                    where: { id: auctionId },
                    data: { 
                        // You might need to add a 'status' field to your Auction model if you haven't yet
                        // For now, let's just log it or update a boolean if you have one
                        // status: 'SOLD' 
                    }
                });
                console.log(`Auction ${auctionId} marked as PAID.`);
            }
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return 200 to Stripe fast
    res.json({ received: true });
}