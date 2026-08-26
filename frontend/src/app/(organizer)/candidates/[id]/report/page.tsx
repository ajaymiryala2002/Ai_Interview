'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      const token = localStorage.getItem('organizerToken');
      if (!token) return router.push('/login');

      try {
        const res = await fetch(`/api/candidates/${id}/report`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setCandidate(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) return (
    <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" style={{ width: '48px', height: '48px', border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (!candidate) return (
    <div className="dashboard-container" style={{ padding: '2rem', textAlign: 'center' }}>
      <p style={{ color: '#94a3b8' }}>Candidate not found.</p>
    </div>
  );

  const session = candidate.sessions?.[0];
  const rejectionProofs = session?.rejection_proofs ? JSON.parse(session.rejection_proofs) : [];

  const getResultBadge = () => {
    if (!session?.result) return null;
    const isSelected = session.result === 'selected';
    return (
      <div className={`result-badge ${isSelected ? 'result-selected' : 'result-rejected'}`}>
        {isSelected ? 'SELECTED' : 'REJECTED'}
      </div>
    );
  };

  return (
    <div className="dashboard-container" style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard')} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          Back
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }} className="gradient-text">{candidate.name}'s Report</h1>
        {getResultBadge()}
      </div>

      {/* Candidate Info */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {candidate.image_url ? (
          <img src={candidate.image_url} alt={candidate.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%', border: '3px solid #3b82f6' }} />
        ) : (
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 600 }}>
            {candidate.name.charAt(0)}
          </div>
        )}
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{candidate.name}</div>
          <div style={{ color: '#94a3b8' }}>{candidate.email}</div>
          <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Role: {candidate.role || 'General'}</div>
        </div>
      </div>

      {!session ? (
        <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', textAlign: 'center', color: '#94a3b8' }}>
          Candidate has not started the interview yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Rejection Details */}
          {session.result === 'rejected' && (
            <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', border: '2px solid rgba(239, 68, 68, 0.3)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#fca5a5', fontWeight: 600 }}>Rejection Details</h2>
              {session.rejection_reason && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Reason:</h3>
                  <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>{session.rejection_reason}</p>
                </div>
              )}
              {rejectionProofs.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.75rem' }}>Proof Snapshots:</h3>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {rejectionProofs.map((url: string, i: number) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <img src={url} alt={`Proof ${i + 1}`} style={{ width: '160px', height: '120px', objectFit: 'cover', borderRadius: '0.5rem', border: '2px solid rgba(239,68,68,0.5)' }} />
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Proof #{i + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {session.face_verified === false && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}>
                  <span style={{ color: '#fca5a5', fontSize: '0.875rem' }}>Face verification failed during the interview.</span>
                </div>
              )}
              {session.cheating_detected && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}>
                  <span style={{ color: '#fca5a5', fontSize: '0.875rem' }}>Cheating detected: {session.cheating_reason}</span>
                </div>
              )}
            </div>
          )}

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className="glass stat-card">
              <div className="stat-value" style={{ color: session.overall_score >= 70 ? '#10b981' : session.overall_score >= 50 ? '#f59e0b' : '#ef4444' }}>
                {session.overall_score !== null ? `${Math.round(session.overall_score)}%` : 'Pending'}
              </div>
              <div className="stat-label">Overall Score</div>
            </div>
            <div className="glass stat-card">
              <div className="stat-value" style={{ color: (session.correct_count || 0) >= 7 ? '#10b981' : '#ef4444' }}>
                {session.correct_count || 0} / 10
              </div>
              <div className="stat-label">Correct Answers</div>
            </div>
            <div className="glass stat-card">
              <div className="stat-value" style={{ color: session.proctorEvents?.length > 0 ? '#ef4444' : '#10b981' }}>
                {session.proctorEvents?.length || 0}
              </div>
              <div className="stat-label">Proctoring Flags</div>
            </div>
            <div className="glass stat-card">
              <div className="stat-value" style={{ color: session.face_verified ? '#10b981' : '#ef4444' }}>
                {session.face_verified ? 'Yes' : 'No'}
              </div>
              <div className="stat-label">Face Verified</div>
            </div>
            <div className="glass stat-card">
              <div className="stat-value" style={{ color: session.total_answered > 0 ? '#3b82f6' : '#64748b' }}>
                {session.total_answered || 0}
              </div>
              <div className="stat-label">Questions Answered</div>
            </div>
            <div className="glass stat-card">
              <div className="stat-value" style={{ color: session.result_email_sent_at ? '#10b981' : '#f59e0b' }}>
                {session.result_email_sent_at ? 'Sent' : 'Pending'}
              </div>
              <div className="stat-label">Result Email</div>
            </div>
          </div>

          {/* Proctoring Timeline */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>Proctoring Timeline</h2>
            {session.proctorEvents?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {session.proctorEvents.map((evt: any) => (
                  <div key={evt.id} style={{ display: 'flex', gap: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', alignItems: 'flex-start' }}>
                    <div style={{ color: evt.event_type === 'FACE_MISMATCH' ? '#fca5a5' : '#ef4444', fontWeight: 600, fontSize: '0.875rem', minWidth: '60px', fontFamily: 'monospace' }}>
                      {Math.floor(evt.timestamp_in_session / 60)}:{(evt.timestamp_in_session % 60).toString().padStart(2, '0')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, color: evt.event_type === 'FACE_MISMATCH' ? '#fca5a5' : '#f8fafc', fontSize: '0.875rem' }}>
                        {evt.event_type.replace(/_/g, ' ')}
                      </span>
                      {evt.snapshot_url && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <img src={evt.snapshot_url} alt="Snapshot" style={{ width: '140px', borderRadius: '0.25rem', border: evt.event_type === 'FACE_MISMATCH' ? '2px solid rgba(239,68,68,0.5)' : 'none' }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', padding: '1rem 0' }}>No suspicious activity detected.</div>
            )}
          </div>

          {/* AI Question Feedback */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>Question Responses</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {session.answers?.map((ans: any, i: number) => (
                <div key={ans.id} style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '0.75rem', borderLeft: `4px solid ${(ans.ai_score || 0) >= 40 ? '#10b981' : '#ef4444'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Q{i + 1}: {ans.question.text}</h3>
                    <span style={{ padding: '0.25rem 0.75rem', backgroundColor: (ans.ai_score || 0) >= 40 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: (ans.ai_score || 0) >= 40 ? '#6ee7b7' : '#fca5a5', fontSize: '0.75rem', fontWeight: 600, borderRadius: '999px' }}>
                      {(ans.ai_score || 0) >= 40 ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <div style={{ color: '#cbd5e1', marginBottom: '1rem', fontStyle: 'italic', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    &ldquo;{ans.answer_text}&rdquo;
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.25rem 0.75rem', backgroundColor: 'rgba(59,130,246,0.2)', borderRadius: '0.25rem', fontWeight: 600, fontSize: '0.875rem', color: '#93c5fd' }}>
                      Score: {ans.ai_score}%
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                      {ans.ai_feedback}
                    </div>
                  </div>
                </div>
              ))}
              {(!session.answers || session.answers.length === 0) && (
                <div style={{ color: '#94a3b8', padding: '1rem 0' }}>No answers submitted yet.</div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
