"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const child_process_1 = require("child_process");
const PORT = process.env.PORT || 5000;
async function bootstrap() {
    try {
        const qCount = await db_1.default.question.count();
        if (qCount === 0) {
            console.log('No questions found in database. Seeding 48 questions before starting server...');
            (0, child_process_1.execSync)('node prisma/seed.js', { cwd: process.cwd(), stdio: 'inherit' });
            console.log('Database seeded successfully.');
        }
        else {
            console.log(`Database already has ${qCount} questions.`);
        }
    }
    catch (err) {
        console.error('Failed to seed database. Fix the error above and restart the server.', err);
        process.exit(1);
    }
    app_1.default.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
bootstrap();
//# sourceMappingURL=server.js.map