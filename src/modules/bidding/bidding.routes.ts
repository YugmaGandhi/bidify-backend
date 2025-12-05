import { Router } from 'express';
import { createBid } from './bidding.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const router = Router();

// Only logged in users can bid
router.post('/', authenticate, createBid);

export default router;