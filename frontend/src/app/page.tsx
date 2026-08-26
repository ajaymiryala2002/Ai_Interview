import Link from 'next/link';

export default function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)',
    }}>
      <div className="glass animate-fade-in" style={{
        maxWidth: '600px',
        width: '100%',
        padding: '3rem',
        borderRadius: '1.5rem',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      }}>
        <h1 className="gradient-text" style={{
          fontSize: '3rem',
          fontWeight: 800,
          marginBottom: '1rem',
          letterSpacing: '-0.025em',
        }}>
          PyProctor AI
        </h1>
        
        <p style={{
          color: '#94a3b8',
          fontSize: '1.125rem',
          lineHeight: '1.75rem',
          marginBottom: '2.5rem',
        }}>
          Next-generation AI-powered proctoring and evaluation platform for coding assessments.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#f8fafc',
            marginBottom: '0.25rem',
          }}>
            Recruiter & Organizer Portal
          </h2>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
          }}>
            <Link href="/login" className="btn-primary" style={{ flex: 1, textDecoration: 'none' }}>
              Sign In
            </Link>
            <Link href="/register" className="btn-secondary" style={{ flex: 1, textDecoration: 'none' }}>
              Create Account
            </Link>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

        <div>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#cbd5e1',
            marginBottom: '0.5rem',
          }}>
            Are you a Candidate?
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Please click the unique link in your invitation email to start your assessment.
          </p>
        </div>
      </div>
    </div>
  );
}
