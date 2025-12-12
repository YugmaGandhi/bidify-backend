import { Router } from 'express';
import { create, deleteAuction, getAll } from './auction.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requirePermission } from '../../common/middleware/rabc.middleware';

const router = Router();

// PUBLIC ROUTE : Anyone can see auctions
router.get('/', getAll);

// Protected route: Only Logged in user can sell
router.post('/', authenticate, requirePermission('auction:create'), create);
router.delete('/:id', authenticate, requirePermission('auction:delete'), deleteAuction);

export default router;