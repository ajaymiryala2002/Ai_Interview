'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { faceValidation, FaceValidationResult, FACE_MATCH_THRESHOLD } from '@/lib/faceValidation';

export default function DeviceCheckPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [starting, setStarting] = useState(false);
  const [faceStatus, setFaceStatus] = useState('Initializing face models…');
  const [candidateImage, setCandidateImage] = useState<string | null>(null);
  const [faceMismatchPopup, setFaceMismatchPopup] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<FaceValidationResult | null>(null);
  const [debugInfo, setDebugInfo] = useState<{
    scores: number[];
    bestDistance: number;
    bestScore: number;
    referenceDetected: boolean;
    attemptsWithFace: number;
  } | null>(null);
  const [modelsReady, setModelsReady] = useState(false);

  useEffect(() => {
    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let microphone: MediaStreamAudioSourceNode;
    let animationFrame: number;

    faceValidation.loadModels()
      .then(() => {
        setModelsReady(true);
        setFaceStatus('Face models loaded. Waiting for camera…');
      })
      .catch(() => {
        setFaceStatus('⚠️ Face models failed to load. Check internet connection.');
      });

    const requestPermissions = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(mediaStream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkAudioLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const average = sum / dataArray.length;
          setAudioLevel(average);
          animationFrame = requestAnimationFrame(checkAudioLevel);
        };
        checkAudioLevel();
      } catch (err) {
        setError('Camera and microphone access is required to proceed. Please check your permissions.');
      }
    };

    requestPermissions();

    const fetchCandidateImage = async () => {
      try {
        const res = await fetch(`/api/invite/${token}`);
        if (res.ok) {
          const data = await res.json();
          if (data.candidateImage) {
            setCandidateImage(data.candidateImage);
            console.log('[DeviceCheck] Candidate image URL:', data.candidateImage);
          }
        }
      } catch (err) {
        console.error('Failed to fetch candidate image:', err);
      }
    };
    fetchCandidateImage();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (audioContext) audioContext.close();
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [token]);

  const runFaceVerification = async (attempts = 3) => {
    if (!videoRef.current || !candidateImage) {
      setFaceStatus('Camera or candidate photo not ready.');
      return { verified: false, score: 0, bestSnapshot: null, attempts: 0, message: 'Not ready' };
    }

    setFaceStatus('Verifying face… Please look at the camera.');

    const result = await faceValidation.validateFace({
      videoElement: videoRef.current,
      candidateImageUrl: candidateImage,
      attempts,
      delayBetweenAttempts: 800
    });

    const passPercent = Math.round(FACE_MATCH_THRESHOLD * 100);
    setFaceStatus(result.message);
    setDebugInfo({
      scores: result.debug.allScores,
      bestDistance: result.debug.bestDistance,
      bestScore: result.score,
      referenceDetected: result.debug.referenceFaceDetected,
      attemptsWithFace: result.attempts,
    });
    if (result.bestSnapshot) setSnapshotUrl(result.bestSnapshot);
    setLastResult(result);

    return result;
  };

  const handleStart = async () => {
    if (!stream) return;
    setStarting(true);

    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      alert('Session not found. Please go back to the invitation link and try again.');
      setStarting(false);
      return;
    }

    const faceResult = await runFaceVerification(3);

    try {
      await fetch(`/api/sessions/${sessionId}/verify-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verified: faceResult.verified,
          faceMatchScore: faceResult.score,
          snapshotUrl: faceResult.bestSnapshot
        })
      });
    } catch (err) {
      console.error('Failed to send face verification:', err);
    }

    if (!faceResult.verified) {
      setFaceMismatchPopup(true);
      setStarting(false);
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${sessionId}/start`, { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${res.status})`);
      }
      router.push(`/interview/${token}/session`);
    } catch (err: any) {
      alert(err.message || 'Failed to start session. Please check your connection.');
      setStarting(false);
    }
  };

  const handleContinueAnyway = async () => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      alert('Session not found. Please go back to the invitation link.');
      return;
    }
    try {
      await fetch(`/api/sessions/${sessionId}/verify-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: true, faceMatchScore: 1.0, snapshotUrl: null })
      });
      const res = await fetch(`/api/sessions/${sessionId}/start`, { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${res.status})`);
      }
      router.push(`/interview/${token}/session`);
    } catch (err: any) {
      alert(err.message || 'Failed to start session.');
    }
  };

  const handleRetry = async () => {
    setFaceMismatchPopup(false);
    setStarting(true);

    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      setStarting(false);
      return;
    }

    const faceResult = await runFaceVerification(5);

    try {
      await fetch(`/api/sessions/${sessionId}/verify-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verified: faceResult.verified,
          faceMatchScore: faceResult.score,
          snapshotUrl: faceResult.bestSnapshot
        })
      });
    } catch (err) {
      console.error('Failed to send face verification:', err);
    }

    if (faceResult.verified) {
      const res = await fetch(`/api/sessions/${sessionId}/start`, { method: 'POST' });
      if (res.ok) {
        router.push(`/interview/${token}/session`);
        return;
      }
    }

    setFaceMismatchPopup(true);
    setStarting(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="glass animate-fade-in" style={{ padding: '2.5rem', borderRadius: '1rem', maxWidth: '600px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }} className="gradient-text">
          Device Check
        </h1>

        <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
          Face threshold: {(FACE_MATCH_THRESHOLD * 100).toFixed(0)}% (lenient mode)
        </div>

        {error ? (
          <div style={{ color: '#fca5a5', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
            {error}
          </div>
        ) : (
          <p style={{ color: '#cbd5e1', marginBottom: '2rem' }}>Please ensure your face is clearly visible and your microphone is picking up sound.</p>
        )}

        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {!stream && !error && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              Requesting permissions...
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>Microphone Level:</span>
          <div style={{ flex: 1, maxWidth: '200px', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: 'var(--success)', width: `${Math.min(100, (audioLevel / 128) * 100)}%`, transition: 'width 0.1s linear' }} />
          </div>
        </div>

        <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: faceStatus.includes('✓') ? '#6ee7b7' : faceStatus.includes('not matching') || faceStatus.includes('not confidently matched') || faceStatus.includes('Failed') || faceStatus.includes('⚠️') ? '#fca5a5' : '#94a3b8' }}>
          {faceStatus}
        </div>
        {debugInfo && (
          <div style={{ marginBottom: '1rem', fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', textAlign: 'left' }}>
            <div>Best score: {(debugInfo.bestScore * 100).toFixed(1)}%</div>
            <div>Best distance: {debugInfo.bestDistance.toFixed(3)}</div>
            <div>Threshold: {(FACE_MATCH_THRESHOLD * 100).toFixed(0)}%</div>
            <div>Reference face detected: {debugInfo.referenceDetected ? 'yes' : 'no'}</div>
            <div>Attempts with face: {debugInfo.attemptsWithFace}</div>
            <div>All scores: {debugInfo.scores.map(s => (s * 100).toFixed(1) + '%').join(', ')}</div>
          </div>
        )}

        {/* Show candidate photo for reference */}
        {candidateImage && (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Your registered photo:</p>
            <img src={candidateImage} alt="Registered" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem', border: '2px solid rgba(59,130,246,0.5)' }} />
          </div>
        )}

        <button
          className="btn-primary"
          style={{ width: '100%', opacity: (stream && modelsReady && !starting) ? 1 : 0.5, cursor: (stream && modelsReady && !starting) ? 'pointer' : 'not-allowed' }}
          disabled={!stream || !modelsReady || starting}
          onClick={handleStart}
        >
          {starting ? 'Verifying Face…' : 'My Devices Work - Start Interview'}
        </button>
      </div>

      {/* Face Mismatch Popup with Retry */}
      {faceMismatchPopup && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fca5a5', marginBottom: '1rem' }}>
              Face Not Confidently Matched
            </h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {lastResult?.message || 'We could not confidently verify your face. This may be due to lighting, angle, or camera quality.'}
            </p>
            {snapshotUrl && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Best captured face:</p>
                <img src={snapshotUrl} alt="Captured" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '0.5rem', border: '2px solid var(--error)' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              <button
                className="btn-primary"
                onClick={handleRetry}
                disabled={starting}
              >
                {starting ? 'Retrying…' : '🔄 Retry Face Verification (Better Lighting)'}
              </button>
              <button
                className="btn-primary"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.3)' }}
                onClick={handleContinueAnyway}
              >
                Continue Anyway — Start Interview
              </button>
              <button
                className="btn-primary"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.3)' }}
                onClick={() => router.push('/')}
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
