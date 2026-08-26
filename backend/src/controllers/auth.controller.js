"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginOrganizer = exports.registerOrganizer = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const registerOrganizer = async (req, res) => {
    try {
        const { name, email, password, org_name } = req.body;
        const existing = await db_1.default.organizer.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        const password_hash = await bcrypt_1.default.hash(password, 10);
        const organizer = await db_1.default.organizer.create({
            data: { name, email, password_hash, org_name }
        });
        res.status(201).json({ message: 'Organizer created successfully', organizerId: organizer.id });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.registerOrganizer = registerOrganizer;
const loginOrganizer = async (req, res) => {
    try {
        const { email, password } = req.body;
        const organizer = await db_1.default.organizer.findUnique({ where: { email } });
        if (!organizer) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcrypt_1.default.compare(password, organizer.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const secret = process.env.JWT_SECRET || 'supersecret_for_local_dev';
        const token = jsonwebtoken_1.default.sign({ id: organizer.id }, secret, { expiresIn: '1d' });
        res.json({ token, organizer: { id: organizer.id, name: organizer.name, org_name: organizer.org_name } });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.loginOrganizer = loginOrganizer;
//# sourceMappingURL=auth.controller.js.map