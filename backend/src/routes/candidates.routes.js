"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const candidates_controller_1 = require("../controllers/candidates.controller");
const router = (0, express_1.Router)();
// Ensure uploads directory exists
const uploadDir = path_1.default.join(process.cwd(), 'public', 'uploads', 'candidates');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/'))
            cb(null, true);
        else
            cb(new Error('Only image files are allowed'));
    }
});
router.use(auth_middleware_1.requireAuth);
router.get('/', candidates_controller_1.listCandidates);
router.post('/', upload.single('image'), candidates_controller_1.addCandidate);
router.post('/:id/grant-access', candidates_controller_1.grantAccess);
router.get('/:id/report', candidates_controller_1.getReport);
router.post('/:id/result', candidates_controller_1.updateResult);
router.delete('/:id', candidates_controller_1.deleteCandidate);
exports.default = router;
//# sourceMappingURL=candidates.routes.js.map