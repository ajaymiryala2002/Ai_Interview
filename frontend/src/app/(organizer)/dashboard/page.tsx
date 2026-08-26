'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  image_url: string | null;
  access_granted: boolean;
  sessions: any[];
  inviteTokens?: any[];
}

const ROLES = ['General', 'Python', 'Java', 'Data Science'];

export default function DashboardPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newCandidateEmail, setNewCandidateEmail] = useState('');
  const [newCandidateRole, setNewCandidateRole] = useState('General');
  const [newCandidateImage, setNewCandidateImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, selected: 0, rejected: 0, pending: 0 });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCandidates = async () => {
    const token = localStorage.getItem('organizerToken');
    if (!token) return router.push('/login');

    try {
      const res = await fetch('/api/candidates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) return router.push('/login');
      const data = await res.json();
      setCandidates(data);

      const total = data.length;
      let selected = 0, rejected = 0, pending = 0;
      data.forEach((c: Candidate) => {
        const session = c.sessions?.[0];
        if (session?.result === 'selected') selected++;
        else if (session?.result === 'rejected') rejected++;
        else pending++;
      });
      setStats({ total, selected, rejected, pending });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewCandidateImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('organizerToken');
    try {
      const formData = new FormData();
      formData.append('name', newCandidateName);
      formData.append('email', newCandidateEmail);
      formData.append('role', newCandidateRole);
      if (newCandidateImage) formData.append('image', newCandidateImage);

      await fetch('/api/candidates', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      setNewCandidateName('');
      setNewCandidateEmail('');
      setNewCandidateRole('General');
      setNewCandidateImage(null);
      setImagePreview(null);
      fetchCandidates();
    } catch (err) {
      console.error('Failed to add candidate');
    }
  };

  const handleGrantAccess = async (id: string) => {
    const token = localStorage.getItem('organizerToken');
    try {
      const res = await fetch(`/api/candidates/${id}/grant-access`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invitation email');
      fetchCandidates();
      alert('Access granted and the invitation email was sent. Link expires in 1 hour.');
    } catch (err) {
      console.error('Failed to grant access', err);
      alert(err instanceof Error ? err.message : 'Failed to send invitation email');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;
    setDeletingId(id);
    const token = localStorage.getItem('organizerToken');
    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      setCandidates(prev => prev.filter(c => c.id !== id));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      alert('Failed to delete candidate');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (candidate: Candidate) => {
    const session = candidate.sessions?.[0];
    const result = session?.result;

    if (result === 'selected') {
      return <span className="badge badge-success">Selected</span>;
    }
    if (result === 'rejected') {
      return <span className="badge badge-danger">Rejected</span>;
    }

    const status = session ? session.status : (candidate.access_granted ? 'Invited' : 'Access Not Granted');
    const isSuccess = status === 'completed';
    const isWarning = status === 'Access Not Granted';

    return (
      <span className={`badge ${isSuccess ? 'badge-success' : isWarning ? 'badge-danger' : 'badge-info'}`}>
        {status === 'cancelled' ? 'Cancelled' : status}
      </span>
    );
  };

  if (loading) return (
    <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" style={{ width: '48px', height: '48px', border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div className="dashboard-container" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }} className="gradient-text">HR Dashboard</h1>
          <p style={{ color: '#94a3b8', marginTop: '0.25rem' }}>Manage candidates and review interview results</p>
        </div>
        <button onClick={() => { localStorage.removeItem('organizerToken'); router.push('/login'); }} className="btn-secondary">
          Logout
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Candidates</div>
        </div>
        <div className="glass stat-card">
          <div className="stat-value" style={{ color: '#10b981' }}>{stats.selected}</div>
          <div className="stat-label">Selected</div>
        </div>
        <div className="glass stat-card">
          <div className="stat-value" style={{ color: '#ef4444' }}>{stats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="glass stat-card">
          <div className="stat-value" style={{ color: '#3b82f6' }}>{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      {/* Add Candidate Form */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>Add New Candidate</h2>
        <form onSubmit={handleAddCandidate} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label className="form-label">Name</label>
            <input type="text" required className="input-field" value={newCandidateName} onChange={(e) => setNewCandidateName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label className="form-label">Email</label>
            <input type="email" required className="input-field" value={newCandidateEmail} onChange={(e) => setNewCandidateEmail(e.target.value)} placeholder="jane@example.com" />
          </div>
          <div style={{ minWidth: '150px' }}>
            <label className="form-label">Role</label>
            <select className="input-field" value={newCandidateRole} onChange={(e) => setNewCandidateRole(e.target.value)} style={{ cursor: 'pointer' }}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ minWidth: '200px' }}>
            <label className="form-label">Photo <span style={{ color: '#ef4444' }}>*</span> (for face verification)</label>
            <input type="file" accept="image/*" required onChange={handleImageChange} className="input-field" style={{ padding: '0.4rem' }} />
          </div>
          <button type="submit" className="btn-primary" style={{ height: '42px' }}>Add Candidate</button>
        </form>
        {imagePreview && (
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src={imagePreview} alt="Preview" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '0.5rem', border: '2px solid #3b82f6' }} />
            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Photo preview</span>
          </div>
        )}
      </div>

      {/* Candidates Table */}
      <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>All Candidates</h2>
          <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{candidates.length} total</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Role</th>
                <th>Status</th>
                <th>Score</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map(candidate => {
                const session = candidate.sessions?.[0];
                const activeToken = candidate.inviteTokens?.[0];
                const inviteLink = activeToken?.token ? `${window.location.origin}/interview/${activeToken.token}/terms` : null;
                const isExpired = activeToken?.expires_at ? new Date() > new Date(activeToken.expires_at) : false;

                return (
                  <tr key={candidate.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {candidate.image_url ? (
                          <img src={candidate.image_url} alt={candidate.name} className="candidate-avatar" />
                        ) : (
                          <div className="candidate-avatar-placeholder">{candidate.name.charAt(0)}</div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{candidate.name}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{candidate.email}</div>
                          {inviteLink && (
                            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ color: isExpired ? '#ef4444' : '#64748b' }}>
                                {isExpired ? 'Expired:' : 'Link:'}
                              </span>
                              <a href={isExpired ? undefined : inviteLink} target="_blank" rel="noopener noreferrer" className="link-text" style={{ opacity: isExpired ? 0.5 : 1, textDecoration: isExpired ? 'line-through' : 'underline' }}>
                                {inviteLink}
                              </a>
                              {!isExpired && (
                                <button onClick={() => { navigator.clipboard.writeText(inviteLink); alert('Copied!'); }} className="copy-btn">
                                  Copy
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span className="role-badge">{candidate.role}</span></td>
                    <td>{getStatusBadge(candidate)}</td>
                    <td>
                      {session?.overall_score !== null && session?.overall_score !== undefined ? (
                        <span style={{ fontWeight: 600, color: session.overall_score >= 70 ? '#10b981' : session.overall_score >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {Math.round(session.overall_score)}%
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {session?.status === 'completed' || session?.status === 'rejected' || session?.status === 'cancelled' ? (
                          <>
                            <button onClick={() => router.push(`/candidates/${candidate.id}/report`)} className="btn-secondary btn-sm">
                              View Report
                            </button>
                            {!session?.result && (
                              <>
                                <button onClick={() => router.push(`/candidates/${candidate.id}/report`)} className="btn-primary btn-sm" style={{ backgroundColor: 'rgba(16, 185, 129, 0.3)' }}>
                                  Select
                                </button>
                                <button onClick={() => router.push(`/candidates/${candidate.id}/report`)} className="btn-primary btn-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.3)' }}>
                                  Reject
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          <button onClick={() => handleGrantAccess(candidate.id)} className="btn-primary btn-sm">
                            {candidate.access_granted ? 'Resend Invite' : 'Grant Access'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(candidate.id, candidate.name)}
                          className="btn-sm"
                          disabled={deletingId === candidate.id}
                          style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            color: '#fca5a5',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            opacity: deletingId === candidate.id ? 0.5 : 1
                          }}
                        >
                          {deletingId === candidate.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {candidates.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    No candidates found. Add one above to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
