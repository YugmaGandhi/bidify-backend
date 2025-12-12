import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { AppError } from '../utils/AppError';
import redis from '../../config/redis';

// This function returns the actual middleware
export const requirePermission = (requiredAction: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return next(new AppError('Not authenticated', 401));
            }

            // OPTIMIZATION: Cache permissions in Redis!
            // Key: "permissions:role:{ROLE_NAME}"
            const cacheKey = `permissions:role:${req.user.role}`;
            let permissions: string[] = [];

            const cachedPerms = await redis.get(cacheKey);

            if (cachedPerms) {
                permissions = JSON.parse(cachedPerms);
            } else {
                // Fallback to DB
                // We find the Role by name, and include its Permissions
                const role = await prisma.role.findUnique({
                    where: { name: req.user.role },
                    include: { permissions: true }
                });

                if (!role) {
                    return next(new AppError('Role not found', 403));
                }

                // Extract action strings: ["auction:create", "bid:place"]
                permissions = role.permissions.map(p => p.action);

                // Cache for 1 hour
                await redis.set(cacheKey, JSON.stringify(permissions), 'EX', 3600);
            }

            // CHECK: Does the user have the required permission?
            if (!permissions.includes(requiredAction)) {
                return next(new AppError('You do not have permission to perform this action', 403));
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};