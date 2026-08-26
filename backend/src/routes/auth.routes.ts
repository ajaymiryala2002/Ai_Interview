import { Router } from 'express';
import { registerOrganizer, loginOrganizer } from '../controllers/auth.controller';

const router = Router();

router.post('/register', registerOrganizer);
router.post('/login', loginOrganizer);

export default router;
