import { Request, Response } from 'express';
import { loginUser, registerUser } from './auth.service';
import { z } from 'zod';
import { catchAsync } from '../../common/utils/catchAsync';
import { ApiResponse } from '../../common/utils/ApiResponse';

// Zod schema for Validation
const registerSchema = z.object({
    email: z.email(),
    name: z.string().min(2),
    password: z.string().min(6),
});

export const register = catchAsync(async (req: Request, res: Response) => {
    // Validate input
    const data = registerSchema.parse(req.body);

    // call service
    const result = await registerUser(data);

    // send response
    return ApiResponse.success(res, 'User registered successfully', result, 201);
});

const loginSchema = z.object({
    email: z.email(),
    password: z.string(),
})

export const login = catchAsync(async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body);
    const result = await loginUser(data);

    return ApiResponse.success(res, 'Login successful', result, 200);
});

export const getProfile = async ( req: Request, res: Response) => {
    // req.user is guaranteed to exist here because the middleware ran first
    if (!req.user) { 
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // We could fetch more details from DB here if needed
    // For now, just return what we have in the token
    res.status(200).json({
        message: 'Profile fetched',
        user: req.user
    });
}