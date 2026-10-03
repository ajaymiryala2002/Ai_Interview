import { Request, Response } from 'express';
export declare const startSession: (req: Request, res: Response) => Promise<void>;
export declare const getNextQuestion: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const submitAnswer: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const logProctoringEvent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const completeSession: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSessionResult: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const cancelSession: (req: Request, res: Response) => Promise<void>;
export declare const verifyFace: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=sessions.controller.d.ts.map