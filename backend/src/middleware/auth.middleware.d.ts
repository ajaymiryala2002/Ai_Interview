import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    organizerId?: string;
}
export declare const requireAuth: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.middleware.d.ts.map