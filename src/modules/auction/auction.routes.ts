import { Router } from 'express';
import { create, getAll } from './auction.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const router = Router();

// PUBLIC ROUTE : Anyone can see auctions
router.get('/', getAll);

// Protected route: Only Logged in user can sell
router.post('/', authenticate, create);

export default router;