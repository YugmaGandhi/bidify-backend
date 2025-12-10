export class AppError extends Error {
    public statusCode: number;
    public status: string;
    public isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;

        //Id code is 4xx, status is 'fail. If 5xx, status is 'error'
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        // Operational = True means "We expected this" (e.g. Wrong Password). 
        // Operational = False means "Bugs" (e.g. ReferenceError).
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}