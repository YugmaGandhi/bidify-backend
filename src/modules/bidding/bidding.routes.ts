import { Router } from 'express';
import { createBid } from './bidding.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { checkIdempotency } from '../../common/middleware/idempotency.middleware';

const router = Router();

// Only logged in users can bid
router.post('/', authenticate, checkIdempotency, createBid);

export default router;