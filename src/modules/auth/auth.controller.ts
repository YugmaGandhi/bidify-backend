import { Request, Response } from 'express';
import { loginUser, registerUser } from './auth.service';
import { z } from 'zod';

// Zod schema for Validation
const registerSchema = z.object({
    email: z.email(),
    name: z.string().min(2),
    password: z.string().min(6),
});

export const register = async (req: Request, res: Response) => {
    try {
        // Validate input
        const data = registerSchema.parse(req.body);

        // call service
        const result = await registerUser(data);

        // send response
        res.status(201).json({
            message: 'User registered successfully',
            data: result,
        });
    } catch ( error: any) {
        // simple error handling for now ( we will improve this later )
        res.status(400).json({
            message: error.message || 'Registration failed',
            errors: error.errors || undefined
        })
    }
}

const loginSchema = z.object({
    email: z.email(),
    password: z.string(),
})

export const login = async ( req: Request, res: Response) => {
    try {
        const data = loginSchema.parse(req.body);
        const result = await loginUser(data);

        res.status(200).json({
            message: 'Login successful',
            data: result,
        });
    } catch ( error: any) {
        res.status(401).json({ // 401 Unauthorized is better for login failures
            message: error.message || 'Login failed',
        })
    }
}

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