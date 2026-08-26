"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const candidates_routes_1 = __importDefault(require("./routes/candidates.routes"));
const invite_routes_1 = __importDefault(require("./routes/invite.routes"));
const sessions_routes_1 = __importDefault(require("./routes/sessions.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
// Serve uploaded candidate images
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'public', 'uploads')));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/candidates', candidates_routes_1.default);
app.use('/api/invite', invite_routes_1.default);
app.use('/api/sessions', sessions_routes_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map