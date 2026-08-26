"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sessions_controller_1 = require("../controllers/sessions.controller");
const router = (0, express_1.Router)();
router.post('/:id/start', sessions_controller_1.startSession);
router.get('/:id/next-question', sessions_controller_1.getNextQuestion);
router.post('/:id/answer', sessions_controller_1.submitAnswer);
router.post('/:id/proctoring-event', sessions_controller_1.logProctoringEvent);
router.post('/:id/complete', sessions_controller_1.completeSession);
router.post('/:id/cancel', sessions_controller_1.cancelSession);
router.post('/:id/verify-face', sessions_controller_1.verifyFace);
exports.default = router;
//# sourceMappingURL=sessions.routes.js.map