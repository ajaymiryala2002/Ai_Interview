import { Request, Response } from 'express';
import prisma from '../config/db';

export const validateToken = async (req: Request, res: Response) => {
  try {
    const token = req.params['token'] as string;
    const invite = await prisma.inviteToken.findUnique({
      where: { token },
      include: { candidate: true }
    });

    if (!invite) return res.status(404).json({ error: 'Invalid token' });
    if (invite.status !== 'pending') return res.status(400).json({ error: `Token is already ${invite.status}` });
    if (new Date() > invite.expires_at) return res.status(400).json({ error: 'Token expired' });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const candidateImage = invite.candidate.image_url
      ? (invite.candidate.image_url.startsWith('http') ? invite.candidate.image_url : `${baseUrl}${invite.candidate.image_url}`)
      : null;

    res.json({
      valid: true,
      candidateName: invite.candidate.name,
      candidateImage
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate token' });
  }
};

export const acceptTerms = async (req: Request, res: Response) => {
  try {
    const token = req.params['token'] as string;
    const invite = await prisma.inviteToken.findUnique({
      where: { token }
    });

    if (!invite || invite.status !== 'pending') {
      return res.status(400).json({ error: 'Invalid or used token' });
    }

    await prisma.inviteToken.update({
      where: { id: invite.id },
      data: { status: 'used' }
    });

    const session = await prisma.interviewSession.create({
      data: {
        candidate_id: invite.candidate_id,
        status: 'in-progress',
        started_at: new Date()
      }
    });

    res.json({ message: 'Terms accepted, session created', sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept terms' });
  }
};
