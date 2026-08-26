import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.middleware';
import { addCandidate, listCandidates, grantAccess, getReport, updateResult, deleteCandidate } from '../controllers/candidates.controller';

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'candidates');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

router.use(requireAuth);

router.get('/', listCandidates);
router.post('/', upload.single('image'), addCandidate);
router.post('/:id/grant-access', grantAccess);
router.get('/:id/report', getReport);
router.post('/:id/result', updateResult);
router.delete('/:id', deleteCandidate);

export default router;
