import { Router } from 'express';
import { getProfile, login, register } from './auth.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);

// PROTECTED ROUTE
// The request hits 'authenticate' first. If it passes, it goes to 'getProfile'.
router.get('/me', authenticate, getProfile);

export default router;