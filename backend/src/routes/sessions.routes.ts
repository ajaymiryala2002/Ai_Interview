import { Router } from 'express';
import { startSession, getNextQuestion, submitAnswer, logProctoringEvent, completeSession, verifyFace, cancelSession, getSessionResult } from '../controllers/sessions.controller';

const router = Router();

router.get('/:id/result', getSessionResult);
router.post('/:id/start', startSession);
router.get('/:id/next-question', getNextQuestion);
router.post('/:id/answer', submitAnswer);
router.post('/:id/proctoring-event', logProctoringEvent);
router.post('/:id/complete', completeSession);
router.post('/:id/cancel', cancelSession);
router.post('/:id/verify-face', verifyFace);

export default router;
