import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { prisma } from "../../config/db";

export const requireVerification = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
         return next(new AppError('Unauthorized', 401));
    }

    // We need to fetch the user status from DB because the JWT might be old
    const user = await prisma.user.findUnique({
        where: { id: req.user.userId }
    });

    if (!user || !user.isVerified) {
         return next(new AppError('Please verify your email address to perform this action.', 403));
    }

    next();
};