'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProctoringService, speakVoiceWarning } from '@/lib/proctoring';
import { faceValidation } from '@/lib/faceValidation';

export default function SessionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [question, setQuestion] = useState<{ id: string; text: string; topic: string; difficulty: string; type: string } | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const proctorRef = useRef<ProctoringService | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [questionError, setQuestionError] = useState('');
  const [proctorStatus, setProctorStatus] = useState('Initializing proctoring...');
  const [faceMismatchPopup, setFaceMismatchPopup] = useState(false);
  const [faceMismatchCountdown, setFaceMismatchCountdown] = useState(30);
  const [faceMismatchProof, setFaceMismatchProof] = useState<string | null>(null);
  const [candidateImage, setCandidateImage] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 1, total: 10 });
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [interviewResult, setInterviewResult] = useState<'selected' | 'rejected' | null>(null);
  const [cheatingDetected, setCheatingDetected] = useState(false);
  const [tabSwitchWarning, setTabSwitchWarning] = useState(false);
  const faceCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const consecutiveMismatchRef = useRef(0);
  const lastTabSwitchTimeRef = useRef(0);

  useEffect(() => {
    faceValidation.loadModels().catch(() => {
      console.error('Failed to load face validation models');
    });

    const fetchCandidateImage = async () => {
      try {
        const res = await fetch(`/api/invite/${token}`);
        if (res.ok) {
          const data = await res.json();
          if (data.candidateImage) setCandidateImage(data.candidateImage);
        }
      } catch (err) {
        console.error('Failed to fetch candidate image:', err);
      }
    };
    fetchCandidateImage();

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);

        const proctor = new ProctoringService(async (eventType, snapshotUrl) => {
          console.warn(`Proctor Event: ${eventType}`);
          if (eventType === 'TAB_SWITCH') {
            setTabSwitchWarning(true);
            setTimeout(() => setTabSwitchWarning(false), 5000);
          }
          const sessionId = localStorage.getItem('sessionId');
          try {
            await fetch(`/api/sessions/${sessionId}/proctoring-event`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ eventType, snapshotUrl })
            });
          } catch (e) { console.error('Failed to log event', e); }
        });
        proctor.initialize()
          .then(() => {
            setProctorStatus('Proctoring active');
            if (videoRef.current) proctor.startProctoring(videoRef.current, stream);
          })
          .catch((err) => {
            console.error('Failed to load proctoring models:', err);
            setProctorStatus('Proctoring unavailable');
          });
        proctorRef.current = proctor;
      })
      .catch((err) => {
        console.error('Camera error:', err);
        setProctorStatus('Camera unavailable');
      });

    // Direct tab switch and window blur detection
    const handleVisibilityOrBlur = async () => {
      const now = Date.now();
      if (now - lastTabSwitchTimeRef.current > 3000) {
        lastTabSwitchTimeRef.current = now;
        console.warn('[Session] Direct Tab Switch / Focus Loss detected!');
        
        speakVoiceWarning('Warning! Do not change tabs. Please return to your interview.');
        
        setTabSwitchWarning(true);
        setTimeout(() => setTabSwitchWarning(false), 5000);

        let snapshot: string | undefined;
        try {
          if (videoRef.current && videoRef.current.readyState === 4) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            snapshot = canvas.toDataURL('image/jpeg', 0.5);
          }
        } catch (err) {
          console.warn('[Session] Failed to capture direct tab switch snapshot:', err);
        }

        const sessionId = localStorage.getItem('sessionId');
        if (sessionId) {
          try {
            await fetch(`/api/sessions/${sessionId}/proctoring-event`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ eventType: 'TAB_SWITCH', snapshotUrl: snapshot || null })
            });
          } catch (e) {
            console.error('[Session] Failed to log direct tab switch event:', e);
          }
        }
      }
    };

    const handleVisibility = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        handleVisibilityOrBlur();
      }
    };

    const handleWindowBlur = () => {
      handleVisibilityOrBlur();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleWindowBlur);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setAnswerText(transcript);
      };
      setSpeechRecognition(recognition);
    }

    fetchNextQuestion();

    return () => {
      proctorRef.current?.stopProctoring();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleWindowBlur);
      if (faceCheckInterval.current) clearInterval(faceCheckInterval.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startPeriodicFaceCheck = () => {
    if (faceCheckInterval.current) clearInterval(faceCheckInterval.current);
    if (!candidateImage || !videoRef.current) return;

    const checkFace = async () => {
      try {
        if (!videoRef.current) return;
        const result = await faceValidation.quickCheck(videoRef.current, candidateImage);

        if (!result.match && result.snapshot) {
          consecutiveMismatchRef.current += 1;
          console.warn(`[Session] Face mismatch frame #${consecutiveMismatchRef.current}, score=${result.score.toFixed(3)}`);

          // Require 3 consecutive failures before alerting to avoid single bad-frame false positives
          if (consecutiveMismatchRef.current < 3) {
            return;
          }

          setFaceMismatchProof(result.snapshot);
          setFaceMismatchPopup(true);

          const sessionId = localStorage.getItem('sessionId');
          if (sessionId) {
            await fetch(`/api/sessions/${sessionId}/verify-face`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ verified: false, faceMatchScore: result.score, snapshotUrl: result.snapshot })
            });
          }

          proctorRef.current?.stopProctoring();
          if (faceCheckInterval.current) clearInterval(faceCheckInterval.current);

          // Start 30-second countdown
          let seconds = 30;
          setFaceMismatchCountdown(seconds);
          countdownInterval.current = setInterval(() => {
            seconds -= 1;
            setFaceMismatchCountdown(seconds);
            if (seconds <= 0) {
              if (countdownInterval.current) clearInterval(countdownInterval.current);
              cancelInterview('Face mismatch detected - interview cancelled after 30 seconds');
            }
          }, 1000);
        } else {
          // Reset counter on any successful match or any frame where a face was detected and matched
          consecutiveMismatchRef.current = 0;
        }
      } catch (err) {
        console.error('Periodic face check error:', err);
      }
    };

    faceCheckInterval.current = setInterval(checkFace, 15000);
  };

  // Periodic face verification during interview
  useEffect(() => {
    startPeriodicFaceCheck();
    return () => { if (faceCheckInterval.current) clearInterval(faceCheckInterval.current); };
  }, [candidateImage]);

  const handleFaceMismatchRetry = async () => {
    if (!videoRef.current || !candidateImage) return;
    setProctorStatus('Retrying face verification…');
    
    const result = await faceValidation.validateFace({
      videoElement: videoRef.current,
      candidateImageUrl: candidateImage,
      attempts: 3,
      delayBetweenAttempts: 600
    });

    if (result.verified) {
      // Clear countdown and popup
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      setFaceMismatchPopup(false);
      consecutiveMismatchRef.current = 0;
      setProctorStatus('Proctoring active');

      // Update verify-face in backend to true again
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) {
        await fetch(`/api/sessions/${sessionId}/verify-face`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ verified: true, faceMatchScore: result.score, snapshotUrl: result.bestSnapshot })
        });
      }

      // Resume proctoring and periodic checking
      if (proctorRef.current && videoRef.current) {
        proctorRef.current.startProctoring(videoRef.current, streamRef.current || undefined);
      }
      
      startPeriodicFaceCheck();
    } else {
      setProctorStatus('Verification failed. Try again.');
      alert('Verification failed. Please align your face in front of the camera with good lighting and click retry.');
    }
  };

  const fetchNextQuestion = async () => {
    setLoadingQuestion(true);
    setQuestionError('');
    try {
      const sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        setQuestionError('No session found. Please restart from the invitation link.');
        setLoadingQuestion(false);
        return;
      }
      const res = await fetch(`/api/sessions/${sessionId}/next-question`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403) {
          if (errData.error?.includes('Face verification failed')) {
            setFaceMismatchPopup(true);
            return;
          }
          if (errData.error?.includes('Cheating')) {
            setCheatingDetected(true);
            return;
          }
        }
        throw new Error(errData.error || `Server error (${res.status})`);
      }
      const data = await res.json();
      if (data.complete) {
        completeInterview();
      } else {
        setQuestion(data.question);
        setProgress(data.progress || { current: 1, total: 10 });
        setAnswerText('');
      }
    } catch (err: any) {
      console.error('Failed to fetch question:', err);
      setQuestionError(err.message || 'Failed to load question.');
    } finally {
      setLoadingQuestion(false);
    }
  };

  const completeInterview = async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) return;
    await fetch(`/api/sessions/${sessionId}/complete`, { method: 'POST' });
    proctorRef.current?.stopProctoring();
    if (faceCheckInterval.current) clearInterval(faceCheckInterval.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setInterviewComplete(true);
  };

  const cancelInterview = async (reason: string) => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) return;
    await fetch(`/api/sessions/${sessionId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    proctorRef.current?.stopProctoring();
    if (faceCheckInterval.current) clearInterval(faceCheckInterval.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setInterviewResult('rejected');
    setInterviewComplete(true);
  };

  const submitAnswer = async () => {
    if (!question || !answerText.trim()) return;
    const sessionId = localStorage.getItem('sessionId');
    await fetch(`/api/sessions/${sessionId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: question.id, answerText })
    });
    fetchNextQuestion();
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      speechRecognition?.stop();
      setIsRecording(false);
    } else {
      setAnswerText('');
      speechRecognition?.start();
      setIsRecording(true);
    }
  };

  // Interview complete screen
  if (interviewComplete) {
    return (
      <div className="interview-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
        <div className="glass result-card" style={{ maxWidth: '500px', width: '100%', padding: '3rem', textAlign: 'center', borderRadius: '1.5rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>
            {interviewResult === 'rejected' || cheatingDetected ? '❌' : '✅'}
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem', color: interviewResult === 'rejected' || cheatingDetected ? '#fca5a5' : '#6ee7b7' }}>
            {interviewResult === 'rejected' || cheatingDetected ? 'Interview Ended' : 'Interview Submitted'}
          </h1>
          <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '2rem' }}>
            {cheatingDetected
              ? 'Cheating was detected during your interview. A rejection email has been sent automatically.'
              : interviewResult === 'rejected'
                ? 'Your interview has been cancelled. A rejection email has been sent automatically.'
                : 'Thank you for completing the interview! Your results will be reviewed and an email will be sent shortly.'}
          </p>
          <button onClick={() => router.push('/')} className="btn-primary" style={{ width: '100%' }}>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-container" style={{ display: 'flex', minHeight: '100vh', padding: '1.5rem', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Question & Answer Panel */}
      <div className="glass main-panel" style={{ flex: 2, padding: '2rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column' }}>
        {tabSwitchWarning && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.25)',
            border: '2px solid #ef4444',
            color: '#fca5a5',
            padding: '0.85rem 1.25rem',
            borderRadius: '0.75rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: 600
          }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <div>
              <strong>Tab Switch Warning:</strong> You changed browser tabs! Voice warning activated. Please remain on this screen.
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 600 }}>Question {progress.current} of {progress.total}</span>
            <span style={{ fontSize: '0.875rem', color: '#3b82f6', fontWeight: 600 }}>{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${(progress.current / progress.total) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '3px', transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {loadingQuestion ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '1.5rem' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#94a3b8' }}>Loading question...</p>
          </div>
        ) : questionError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '1.5rem' }}>
            <div style={{ fontSize: '3rem' }}>⚠️</div>
            <p style={{ color: '#fca5a5', textAlign: 'center', maxWidth: '400px' }}>{questionError}</p>
            <button className="btn-primary" onClick={fetchNextQuestion}>Retry</button>
          </div>
        ) : question ? (
          <>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ padding: '0.25rem 0.75rem', backgroundColor: question.type === 'problem_solving' ? 'rgba(139,92,246,0.2)' : 'rgba(59,130,246,0.2)', color: question.type === 'problem_solving' ? '#c4b5fd' : '#93c5fd', fontSize: '0.75rem', fontWeight: 600, borderRadius: '999px', textTransform: 'uppercase' }}>
                {question.type === 'problem_solving' ? 'Problem Solving' : 'Theoretical'}
              </span>
              <span style={{ padding: '0.25rem 0.75rem', backgroundColor: question.difficulty === 'Easy' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: question.difficulty === 'Easy' ? '#6ee7b7' : '#fcd34d', fontSize: '0.75rem', fontWeight: 600, borderRadius: '999px' }}>
                {question.difficulty}
              </span>
              <span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, borderRadius: '999px' }}>
                {question.topic}
              </span>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '2rem', color: '#f8fafc', lineHeight: 1.5 }}>
              {question.text}
            </h2>

            <textarea
              className="input-field"
              style={{ flex: 1, resize: 'none', minHeight: '250px', marginBottom: '1.5rem', fontFamily: 'monospace', fontSize: '1.05rem', lineHeight: 1.6 }}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your answer here or click the microphone to speak..."
            />

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={toggleVoiceRecording} className="btn-secondary" style={{ borderColor: isRecording ? '#ef4444' : 'var(--border)' }}>
                {isRecording ? 'Stop Recording' : 'Answer with Voice'}
              </button>

              <button onClick={submitAnswer} className="btn-primary" disabled={!answerText.trim()}>
                Submit Answer & Next
              </button>
            </div>
          </>
        ) : null}
      </div>

      {/* Proctoring & Video Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '380px' }}>
        <div className="glass" style={{ borderRadius: '1rem', padding: '1rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: proctorStatus.includes('active') ? '#10b981' : '#ef4444', animation: proctorStatus.includes('active') ? 'pulse 2s infinite' : 'none' }} />
            <h3 style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>{proctorStatus}</h3>
          </div>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', backgroundColor: '#000', borderRadius: '0.75rem', overflow: 'hidden', border: '2px solid rgba(59,130,246,0.3)' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', padding: '4px 8px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '4px', fontSize: '0.7rem', color: '#94a3b8' }}>
              Live
            </div>
          </div>
        </div>

        {/* Interview Info Card */}
        <div className="glass" style={{ borderRadius: '1rem', padding: '1.25rem' }}>
          <h4 style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.75rem', fontWeight: 600 }}>Interview Rules</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#10b981' }}>✓</span> 10 questions total
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#10b981' }}>✓</span> Need 7 correct to pass
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#ef4444' }}>✗</span> No new tabs allowed
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#ef4444' }}>✗</span> Face must match photo
            </li>
          </ul>
        </div>
      </div>

      {/* Face Mismatch Popup with Countdown */}
      {faceMismatchPopup && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass" style={{ padding: '2.5rem', borderRadius: '1.5rem', maxWidth: '520px', width: '100%', textAlign: 'center', border: '2px solid rgba(239,68,68,0.4)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🚫</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fca5a5', marginBottom: '0.75rem' }}>
              Your Face Is Not Matching
            </h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
              The person in front of the camera does not match the registered candidate photo.
              This interview will be automatically cancelled.
            </p>

            {/* Countdown */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>
                {faceMismatchCountdown}s
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>until interview is cancelled</p>
            </div>

            {faceMismatchProof && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Detected snapshot:</p>
                <img src={faceMismatchProof} alt="Proof" style={{ width: '160px', height: '160px', objectFit: 'cover', borderRadius: '0.75rem', border: '2px solid #ef4444' }} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="btn-primary"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.4)', width: '100%', fontSize: '1rem' }}
                onClick={handleFaceMismatchRetry}
              >
                🔄 Verify Face Again
              </button>
              <button
                className="btn-primary"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.3)', width: '100%', fontSize: '1rem' }}
                onClick={() => router.push('/')}
              >
                Leave Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cheating Detected Popup */}
      {cheatingDetected && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass" style={{ padding: '2.5rem', borderRadius: '1.5rem', maxWidth: '520px', width: '100%', textAlign: 'center', border: '2px solid rgba(239,68,68,0.4)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fca5a5', marginBottom: '0.75rem' }}>
              Cheating Detected
            </h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Suspicious activity was detected during your interview. This interview is invalidated and a rejection email has been sent automatically.
            </p>
            <button className="btn-primary" style={{ backgroundColor: 'rgba(239, 68, 68, 0.3)', width: '100%' }} onClick={() => router.push('/')}>
              Return to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
