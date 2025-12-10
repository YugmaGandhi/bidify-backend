import { Router } from 'express';
import { getProfile, login, register } from './auth.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { authLimiter } from '../../config/rateLimiter';

const router = Router();

// Apply strict limits specifically to these routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// PROTECTED ROUTE
// The request hits 'authenticate' first. If it passes, it goes to 'getProfile'.
router.get('/me', authenticate, getProfile);

export default router;