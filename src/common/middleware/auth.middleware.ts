import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define the shape of the JWT payload
interface TokenPayload {
    userId: string;
    role: string;
    iat: number;
    exp: number;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try{
        // get tokken from headers
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;

        // attach user to request
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };

        //pass control to next middleware
        next();
    } catch (error) {
         res.status(401).json({ message: 'Invalid or expired token' });
         return;
    }
}