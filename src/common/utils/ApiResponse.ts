import { Response } from 'express';

export class ApiResponse {
    static success(res: Response, message: string, data: any = null, statusCode: number = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            statusCode
        });
    }

    static error(res: Response, message: string, statusCode: number = 500, errors: any = null) {
        return res.status(statusCode).json({
            success: false,
            message,
            statusCode,
            errors: errors || null
        });
    }
}