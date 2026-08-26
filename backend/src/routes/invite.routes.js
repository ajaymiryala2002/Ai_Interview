"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invite_controller_1 = require("../controllers/invite.controller");
const router = (0, express_1.Router)();
router.get('/:token', invite_controller_1.validateToken);
router.post('/:token/accept', invite_controller_1.acceptTerms);
exports.default = router;
//# sourceMappingURL=invite.routes.js.map