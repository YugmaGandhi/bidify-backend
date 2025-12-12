import { JwtPayload } from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role: string; //'ADMIN' or 'USER"
                // we might attach permissions here via middleware later
                permissions?: String[]
            }
        }
    }
}