import { Router } from "express";
import { createCheckout, handleWebhook } from "./payment.controller";
import { authenticate } from "../../common/middleware/auth.middleware";

const router = Router();

// PUBLIC ROUTE (Stripe need to hit this without JWT Token!)
router.post('/webhook', handleWebhook);

// Protected: Only logged-in users can pay
router.post('/create-checkout-session', authenticate, createCheckout);

export default router;