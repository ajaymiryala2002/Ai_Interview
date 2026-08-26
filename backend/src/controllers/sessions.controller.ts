import { Request, Response } from 'express';
import prisma from '../config/db';
import { scoreSession } from '../services/scoring.service';
import { compareFacesWithPython } from '../services/pythonFace.service';

const QUESTIONS_PER_SESSION = 10;
const PASSING_THRESHOLD = 7;

export const startSession = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    await prisma.interviewSession.update({
      where: { id },
      data: { status: 'in-progress', started_at: new Date() }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start session' });
  }
};

export const getNextQuestion = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const session = await prisma.interviewSession.findUnique({
      where: { id },
      include: { candidate: true, answers: { include: { question: true } } }
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });

    // If face verification failed, return special message
    if (session.face_verified === false && session.face_match_score !== null) {
      return res.status(403).json({ error: 'Face verification failed. Interview invalidated.' });
    }

    // If cheating detected, return special message
    if (session.cheating_detected) {
      return res.status(403).json({ error: 'Cheating detected. Interview invalidated.' });
    }

    // If session cancelled
    if (session.status === 'cancelled') {
      return res.status(403).json({ error: 'Interview has been cancelled.' });
    }

    const candidateRole = session.candidate.role || 'General';
    const answeredQuestionIds = session.answers.map(a => a.question_id);
    const answeredQuestionTexts = new Set(session.answers.map(a => a.question.text.toLowerCase().trim()));

    // If we already have 10 questions answered, complete the session
    if (answeredQuestionIds.length >= QUESTIONS_PER_SESSION) {
      return res.json({ complete: true, message: 'All questions answered.' });
    }

    // Fetch questions filtered by candidate role and difficulty (Easy + Medium only)
    const allQuestions = await prisma.question.findMany({
      where: {
        role: candidateRole,
        difficulty: { in: ['Easy', 'Medium'] }
      }
    });

    // Fallback to General questions if no role-specific questions exist
    const questions = allQuestions.length > 0 ? allQuestions : await prisma.question.findMany({
      where: {
        role: 'General',
        difficulty: { in: ['Easy', 'Medium'] }
      }
    });

    // Filter out already answered questions by ID and by text (deduplicate)
    const remainingQuestions = questions.filter(q => {
      const notById = !answeredQuestionIds.includes(q.id);
      const notByText = !answeredQuestionTexts.has(q.text.toLowerCase().trim());
      return notById && notByText;
    });

    // If no more questions, complete
    if (remainingQuestions.length === 0) {
      return res.json({ complete: true, message: 'No more questions available.' });
    }

    // Pick a random question from remaining
    const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
    const nextQuestion = remainingQuestions[randomIndex];

    if (!nextQuestion) {
      return res.json({ complete: true, message: 'No more questions available.' });
    }

    res.json({
      question: {
        id: nextQuestion.id,
        text: nextQuestion.text,
        topic: nextQuestion.topic,
        difficulty: nextQuestion.difficulty,
        type: nextQuestion.type
      },
      progress: {
        current: answeredQuestionIds.length + 1,
        total: QUESTIONS_PER_SESSION
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch question' });
  }
};

export const submitAnswer = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const { questionId, answerText } = req.body;

    const session = await prisma.interviewSession.findUnique({
      where: { id },
      include: { answers: true }
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status === 'cancelled') return res.status(403).json({ error: 'Interview cancelled' });
    if (session.cheating_detected) return res.status(403).json({ error: 'Cheating detected' });

    const answer = await prisma.answer.create({
      data: {
        session_id: id,
        question_id: questionId,
        answer_text: answerText
      }
    });

    // Update total answered count
    await prisma.interviewSession.update({
      where: { id },
      data: { total_answered: { increment: 1 } }
    });

    res.json({ success: true, answerId: answer.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit answer' });
  }
};

export const logProctoringEvent = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const { eventType, snapshotUrl } = req.body;

    const session = await prisma.interviewSession.findUnique({ where: { id } });
    if (!session || !session.started_at) return res.status(400).json({ error: 'Invalid session' });

    const timestamp_in_session = Math.floor((Date.now() - session.started_at.getTime()) / 1000);

    // If cheating detected, mark session
    if (eventType === 'CHEATING_DETECTED') {
      await prisma.interviewSession.update({
        where: { id },
        data: {
          cheating_detected: true,
          cheating_reason: 'Suspicious activity detected during interview',
          status: 'rejected'
        }
      });
    }

    await prisma.proctoringEvent.create({
      data: {
        session_id: id,
        event_type: eventType,
        timestamp_in_session,
        snapshot_url: snapshotUrl
      }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log event' });
  }
};

export const completeSession = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    await prisma.interviewSession.update({
      where: { id },
      data: { status: 'completed', ended_at: new Date() }
    });

    scoreSession(id).catch(err => {
      console.error(`Failed to score session ${id}:`, err);
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete session' });
  }
};

export const cancelSession = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const { reason } = req.body;

    await prisma.interviewSession.update({
      where: { id },
      data: {
        status: 'cancelled',
        ended_at: new Date(),
        rejection_reason: reason || 'Interview cancelled by system'
      }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel session' });
  }
};

export const verifyFace = async (req: Request, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const { faceMatchScore, snapshotUrl, verified } = req.body;

    const session = await prisma.interviewSession.findUnique({
      where: { id },
      include: { candidate: true }
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });

    let isVerified = verified === true;
    let finalScore = faceMatchScore || 0;
    let pythonMessage = '';

    // Run Python OpenCV + face_recognition library if candidate image & live snapshot are available
    if (session.candidate?.image_url && snapshotUrl && snapshotUrl.startsWith('data:image')) {
      try {
        const pythonResult = await compareFacesWithPython(session.candidate.image_url, snapshotUrl);
        console.log('[VerifyFace API] Python OpenCV verification output:', pythonResult);
        
        isVerified = pythonResult.verified || verified === true;
        finalScore = pythonResult.score > 0 ? pythonResult.score : finalScore;
        pythonMessage = pythonResult.message;
      } catch (pErr) {
        console.error('[VerifyFace API] Python comparison execution error:', pErr);
        isVerified = verified === true || (faceMatchScore || 0) >= 0.30;
      }
    } else {
      isVerified = verified === true || (faceMatchScore || 0) >= 0.30;
    }

    await prisma.interviewSession.update({
      where: { id },
      data: {
        face_verified: isVerified,
        face_match_score: finalScore
      }
    });

    // If face verification failed, log it as a proctoring event with snapshot proof
    if (!isVerified && snapshotUrl) {
      const timestamp_in_session = session.started_at
        ? Math.floor((Date.now() - session.started_at.getTime()) / 1000)
        : 0;

      await prisma.proctoringEvent.create({
        data: {
          session_id: id,
          event_type: 'FACE_MISMATCH',
          timestamp_in_session,
          snapshot_url: snapshotUrl
        }
      });
    }

    res.json({ verified: isVerified, faceMatchScore: finalScore, message: pythonMessage });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify face' });
  }
};
