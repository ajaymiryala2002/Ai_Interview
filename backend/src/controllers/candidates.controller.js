"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCandidate = exports.updateResult = exports.getReport = exports.grantAccess = exports.listCandidates = exports.addCandidate = void 0;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../config/db"));
const email_service_1 = require("../services/email.service");
const addCandidate = async (req, res) => {
    try {
        const { name, email, phone, role } = req.body;
        const organizer_id = req.organizerId;
        if (!organizer_id)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!req.file) {
            return res.status(400).json({ error: 'Candidate photo is required for face verification' });
        }
        const image_url = `/uploads/candidates/${req.file.filename}`;
        const candidate = await db_1.default.candidate.create({
            data: { organizer_id, name, email, phone, role: role || 'General', image_url }
        });
        res.status(201).json(candidate);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add candidate' });
    }
};
exports.addCandidate = addCandidate;
const listCandidates = async (req, res) => {
    try {
        const organizer_id = req.organizerId;
        if (!organizer_id)
            return res.status(401).json({ error: 'Unauthorized' });
        const candidates = await db_1.default.candidate.findMany({
            where: { organizer_id },
            include: {
                sessions: true,
                inviteTokens: { orderBy: { createdAt: 'desc' } }
            }
        });
        res.json(candidates);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to list candidates' });
    }
};
exports.listCandidates = listCandidates;
const grantAccess = async (req, res) => {
    try {
        const id = req.params['id'];
        const organizer_id = req.organizerId;
        if (!organizer_id)
            return res.status(401).json({ error: 'Unauthorized' });
        const candidate = await db_1.default.candidate.findFirst({
            where: { id, organizer_id: organizer_id }
        });
        if (!candidate)
            return res.status(404).json({ error: 'Candidate not found' });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const expires_at = new Date();
        expires_at.setHours(expires_at.getHours() + 48); // 48 hours validity for testing
        const invite = await db_1.default.inviteToken.create({
            data: {
                candidate_id: candidate.id,
                token,
                expires_at
            }
        });
        await db_1.default.candidate.update({
            where: { id },
            data: { access_granted: true }
        });
        const inviteLink = `${frontendUrl.replace(/\/$/, '')}/interview/${token}/terms`;
        let emailSent = false;
        let emailNotice = '';
        try {
            (0, email_service_1.assertEmailConfiguration)();
            await (0, email_service_1.sendInterviewInvitationEmail)(candidate, inviteLink);
            emailSent = true;
        }
        catch (mailErr) {
            console.warn(`[GrantAccess] Email not sent (${mailErr.message}). Active link: ${inviteLink}`);
            emailNotice = ' (Note: Email was not sent due to unconfigured SMTP. You can copy the invite link directly).';
        }
        res.json({
            message: `Access granted successfully!${emailNotice}`,
            inviteLink,
            emailSent
        });
    }
    catch (error) {
        console.error('Failed to grant access:', error);
        res.status(500).json({ error: 'Failed to grant candidate access' });
    }
};
exports.grantAccess = grantAccess;
const getReport = async (req, res) => {
    try {
        const id = req.params['id'];
        const organizer_id = req.organizerId;
        if (!organizer_id)
            return res.status(401).json({ error: 'Unauthorized' });
        const candidate = await db_1.default.candidate.findFirst({
            where: { id, organizer_id: organizer_id },
            include: {
                sessions: {
                    include: {
                        answers: { include: { question: true } },
                        proctorEvents: true
                    }
                }
            }
        });
        if (!candidate)
            return res.status(404).json({ error: 'Candidate not found' });
        res.json(candidate);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch report' });
    }
};
exports.getReport = getReport;
const updateResult = async (req, res) => {
    try {
        const id = req.params['id'];
        const organizer_id = req.organizerId;
        if (!organizer_id)
            return res.status(401).json({ error: 'Unauthorized' });
        const { result, rejection_reason } = req.body;
        if (!result || !['selected', 'rejected'].includes(result)) {
            return res.status(400).json({ error: 'Invalid result. Must be selected or rejected.' });
        }
        const candidate = await db_1.default.candidate.findFirst({
            where: { id, organizer_id: organizer_id },
            include: { sessions: { orderBy: { createdAt: 'desc' }, take: 1 } }
        });
        if (!candidate)
            return res.status(404).json({ error: 'Candidate not found' });
        const session = candidate.sessions[0];
        if (!session)
            return res.status(400).json({ error: 'No interview session found for this candidate' });
        await db_1.default.interviewSession.update({
            where: { id: session.id },
            data: {
                result,
                rejection_reason: result === 'rejected' ? rejection_reason : null,
                status: result === 'rejected' ? 'rejected' : 'completed'
            }
        });
        res.json({ message: `Candidate marked as ${result}` });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update result' });
    }
};
exports.updateResult = updateResult;
const deleteCandidate = async (req, res) => {
    try {
        const id = req.params['id'];
        const organizer_id = req.organizerId;
        if (!organizer_id)
            return res.status(401).json({ error: 'Unauthorized' });
        const candidate = await db_1.default.candidate.findFirst({
            where: { id, organizer_id: organizer_id },
            include: { sessions: true, inviteTokens: true }
        });
        if (!candidate)
            return res.status(404).json({ error: 'Candidate not found' });
        // Delete related records first to avoid foreign key constraint errors
        for (const session of candidate.sessions) {
            await db_1.default.proctoringEvent.deleteMany({ where: { session_id: session.id } });
            await db_1.default.answer.deleteMany({ where: { session_id: session.id } });
        }
        await db_1.default.interviewSession.deleteMany({ where: { candidate_id: id } });
        await db_1.default.inviteToken.deleteMany({ where: { candidate_id: id } });
        await db_1.default.candidate.delete({ where: { id } });
        res.json({ message: 'Candidate deleted successfully' });
    }
    catch (error) {
        console.error('Delete candidate error:', error);
        res.status(500).json({ error: 'Failed to delete candidate' });
    }
};
exports.deleteCandidate = deleteCandidate;
//# sourceMappingURL=candidates.controller.js.map