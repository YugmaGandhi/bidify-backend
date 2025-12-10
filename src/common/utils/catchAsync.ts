import { Request, Response, NextFunction } from 'express';

// It takes a function (fn) and returns a new function that handles errors
export const catchAsync = (fn: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // If 'fn' throws a promise rejection, .catch(next) passes it to the global error handler
        fn(req, res, next).catch(next);
    };
};