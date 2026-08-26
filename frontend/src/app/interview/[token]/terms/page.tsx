'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { use } from "react";

export default function TermsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [candidateName, setCandidateName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    fetch(`/api/invite/${token}`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) return res.json().then(d => { throw new Error(d.error || `Server error (${res.status})`); });
        return res.json();
      })
      .then(data => {
        if (data.error) setError(data.error);
        else setCandidateName(data.candidateName);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please check your connection and try again.');
        } else {
          setError(err.message || 'Failed to validate link. Please make sure the backend server is running.');
        }
        setLoading(false);
      });

    return () => { clearTimeout(timeoutId); controller.abort(); };
  }, [token]);

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/invite/${token}/accept`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      localStorage.setItem('sessionId', data.sessionId);
      router.push(`/interview/${token}/device-check`);
    } catch (err: any) {
      alert(err.message || 'Failed to accept terms. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1.5rem' }}>
        <div style={{
          width: '48px', height: '48px',
          border: '4px solid rgba(255,255,255,0.1)',
          borderTop: '4px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#94a3b8' }}>Validating your interview link…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
        <div className="glass animate-fade-in" style={{ padding: '2.5rem', borderRadius: '1rem', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: '#fca5a5' }}>
            Unable to Load Interview
          </h1>
          <p style={{ color: '#cbd5e1', marginBottom: '2rem', lineHeight: 1.6 }}>
            {error}
          </p>
          <button
            className="btn-primary"
            style={{ width: '100%' }}
            onClick={() => window.location.reload()}
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="glass animate-fade-in" style={{ padding: '2.5rem', borderRadius: '1rem', maxWidth: '600px', width: '100%' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }} className="gradient-text">
          Welcome, {candidateName}
        </h1>

        <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', height: '300px', overflowY: 'auto', fontSize: '0.9rem', lineHeight: 1.6, color: '#cbd5e1' }}>
          <h2 style={{ color: 'white', marginBottom: '1rem' }}>Terms & Conditions</h2>
          <p style={{ marginBottom: '1rem' }}>By proceeding with this technical interview, you agree to the following:</p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Your video and audio will be recorded for the duration of the interview for review by the organizer.</li>
            <li style={{ marginBottom: '0.5rem' }}>AI-based proctoring algorithms will analyze your video feed locally to ensure academic integrity.</li>
            <li style={{ marginBottom: '0.5rem' }}>You must keep your face clearly visible in the camera frame.</li>
            <li style={{ marginBottom: '0.5rem' }}>The use of secondary devices (phones, tablets, second monitors) is strictly prohibited.</li>
            <li style={{ marginBottom: '0.5rem' }}>The presence of other individuals during the interview is not allowed.</li>
          </ul>
          <p>If you do not consent to these terms, please close this window. Your refusal will be logged.</p>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary)' }}
          />
          <span>I have read, understood, and accept the Terms & Conditions.</span>
        </label>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className="btn-primary"
            style={{ flex: 1, opacity: (accepted && !submitting) ? 1 : 0.5, cursor: (accepted && !submitting) ? 'pointer' : 'not-allowed' }}
            disabled={!accepted || submitting}
            onClick={handleAccept}
          >
            {submitting ? 'Starting…' : 'I Accept & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
