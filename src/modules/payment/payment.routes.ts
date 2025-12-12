import { Router } from "express";
import { createCheckout, handleWebhook } from "./payment.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { checkIdempotency } from "../../common/middleware/idempotency.middleware";

const router = Router();

// PUBLIC ROUTE (Stripe need to hit this without JWT Token!)
router.post('/webhook', handleWebhook);

// Protected: Only logged-in users can pay
router.post('/create-checkout-session', authenticate, checkIdempotency, createCheckout);

export default router;