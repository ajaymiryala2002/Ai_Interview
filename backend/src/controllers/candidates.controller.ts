import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { assertEmailConfiguration, sendInterviewInvitationEmail } from '../services/email.service';

export const addCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, role } = req.body;
    const organizer_id = req.organizerId;
    if (!organizer_id) return res.status(401).json({ error: 'Unauthorized' });

    if (!(req as any).file) {
      return res.status(400).json({ error: 'Candidate photo is required for face verification' });
    }

    const image_url = `/uploads/candidates/${(req as any).file.filename}`;

    const candidate = await prisma.candidate.create({
      data: { organizer_id, name, email, phone, role: role || 'General', image_url }
    });

    res.status(201).json(candidate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add candidate' });
  }
};

export const listCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const organizer_id = req.organizerId;
    if (!organizer_id) return res.status(401).json({ error: 'Unauthorized' });

    const candidates = await prisma.candidate.findMany({
      where: { organizer_id },
      include: {
        sessions: true,
        inviteTokens: { orderBy: { createdAt: 'desc' } }
      }
    });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list candidates' });
  }
};

export const grantAccess = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const organizer_id = req.organizerId;
    if (!organizer_id) return res.status(401).json({ error: 'Unauthorized' });

    const candidate = await prisma.candidate.findFirst({
      where: { id, organizer_id: organizer_id as string }
    });

    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + 48); // 48 hours validity for testing

    const invite = await prisma.inviteToken.create({
      data: {
        candidate_id: candidate.id,
        token,
        expires_at
      }
    });

    await prisma.candidate.update({
      where: { id },
      data: { access_granted: true }
    });

    const inviteLink = `${frontendUrl.replace(/\/$/, '')}/interview/${token}/terms`;

    let emailSent = false;
    let emailNotice = '';
    try {
      assertEmailConfiguration();
      await sendInterviewInvitationEmail(candidate, inviteLink);
      emailSent = true;
    } catch (mailErr: any) {
      console.warn(`[GrantAccess] Email not sent (${mailErr.message}). Active link: ${inviteLink}`);
      emailNotice = ' (Note: Email was not sent due to unconfigured SMTP. You can copy the invite link directly).';
    }

    res.json({
      message: `Access granted successfully!${emailNotice}`,
      inviteLink,
      emailSent
    });
  } catch (error) {
    console.error('Failed to grant access:', error);
    res.status(500).json({ error: 'Failed to grant candidate access' });
  }
};

export const getReport = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const organizer_id = req.organizerId;
    if (!organizer_id) return res.status(401).json({ error: 'Unauthorized' });

    const candidate = await prisma.candidate.findFirst({
      where: { id, organizer_id: organizer_id as string },
      include: {
        sessions: {
          include: {
            answers: { include: { question: true } },
            proctorEvents: true
          }
        }
      }
    });

    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    res.json(candidate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

export const updateResult = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const organizer_id = req.organizerId;
    if (!organizer_id) return res.status(401).json({ error: 'Unauthorized' });

    const { result, rejection_reason } = req.body;
    if (!result || !['selected', 'rejected'].includes(result)) {
      return res.status(400).json({ error: 'Invalid result. Must be selected or rejected.' });
    }

    const candidate = await prisma.candidate.findFirst({
      where: { id, organizer_id: organizer_id as string },
      include: { sessions: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const session = candidate.sessions[0];
    if (!session) return res.status(400).json({ error: 'No interview session found for this candidate' });

    await prisma.interviewSession.update({
      where: { id: session.id },
      data: {
        result,
        rejection_reason: result === 'rejected' ? rejection_reason : null,
        status: result === 'rejected' ? 'rejected' : 'completed'
      }
    });

    res.json({ message: `Candidate marked as ${result}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update result' });
  }
};

export const deleteCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const organizer_id = req.organizerId;
    if (!organizer_id) return res.status(401).json({ error: 'Unauthorized' });

    const candidate = await prisma.candidate.findFirst({
      where: { id, organizer_id: organizer_id as string },
      include: { sessions: true, inviteTokens: true }
    });

    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    // Delete related records first to avoid foreign key constraint errors
    for (const session of candidate.sessions) {
      await prisma.proctoringEvent.deleteMany({ where: { session_id: session.id } });
      await prisma.answer.deleteMany({ where: { session_id: session.id } });
    }
    await prisma.interviewSession.deleteMany({ where: { candidate_id: id } });
    await prisma.inviteToken.deleteMany({ where: { candidate_id: id } });
    await prisma.candidate.delete({ where: { id } });

    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
};
