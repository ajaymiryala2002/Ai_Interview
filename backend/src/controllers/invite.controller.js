"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptTerms = exports.validateToken = void 0;
const db_1 = __importDefault(require("../config/db"));
const validateToken = async (req, res) => {
    try {
        const token = req.params['token'];
        const invite = await db_1.default.inviteToken.findUnique({
            where: { token },
            include: { candidate: true }
        });
        if (!invite)
            return res.status(404).json({ error: 'Invalid token' });
        if (new Date() > invite.expires_at)
            return res.status(400).json({ error: 'Token expired' });
        // Check if session is already completed
        const existingSession = await db_1.default.interviewSession.findFirst({
            where: { candidate_id: invite.candidate_id },
            orderBy: { createdAt: 'desc' }
        });
        if (invite.status === 'used' && existingSession && ['completed', 'rejected', 'cancelled'].includes(existingSession.status)) {
            return res.status(400).json({ error: 'This interview has already been submitted or completed.' });
        }
        // Keep candidateImage relative (/uploads/...) so mobile phones on ngrok fetch from the public origin
        const candidateImage = invite.candidate.image_url || null;
        res.json({
            valid: true,
            candidateName: invite.candidate.name,
            candidateRole: invite.candidate.role,
            candidateImage
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to validate token' });
    }
};
exports.validateToken = validateToken;
const acceptTerms = async (req, res) => {
    try {
        const token = req.params['token'];
        const invite = await db_1.default.inviteToken.findUnique({
            where: { token }
        });
        if (!invite) {
            return res.status(404).json({ error: 'Invalid token' });
        }
        const existingSession = await db_1.default.interviewSession.findFirst({
            where: { candidate_id: invite.candidate_id },
            orderBy: { createdAt: 'desc' }
        });
        if (existingSession && existingSession.status === 'in-progress') {
            return res.json({ message: 'Terms already accepted', sessionId: existingSession.id });
        }
        if (invite.status !== 'pending') {
            return res.status(400).json({ error: 'This interview token has already been used.' });
        }
        await db_1.default.inviteToken.update({
            where: { id: invite.id },
            data: { status: 'used' }
        });
        const session = await db_1.default.interviewSession.create({
            data: {
                candidate_id: invite.candidate_id,
                status: 'in-progress',
                started_at: new Date()
            }
        });
        res.json({ message: 'Terms accepted, session created', sessionId: session.id });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to accept terms' });
    }
};
exports.acceptTerms = acceptTerms;
//# sourceMappingURL=invite.controller.js.map