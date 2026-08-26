import { Router } from 'express';
import { validateToken, acceptTerms } from '../controllers/invite.controller';

const router = Router();

router.get('/:token', validateToken);
router.post('/:token/accept', acceptTerms);

export default router;
