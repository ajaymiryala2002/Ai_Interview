'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Landing page for /interview/[token].
 * Immediately redirects to the terms page so that candidates who
 * receive a bare link (without /terms) still end up in the right place.
 */
export default function InterviewLanding({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/interview/${token}/terms`);
  }, [token, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: '#94a3b8' }}>Redirecting…</p>
    </div>
  );
}
