'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CoachingAgentSelector } from '@/components/coaching/agent-selector';

export default function CoachingPage() {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);

  const handleSelect = useCallback(
    async (agentName: string) => {
      setConnecting(true);
      try {
        const res = await fetch('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: 'coaching',
            agentName,
          }),
        });
        const data = await res.json();
        if (data.token) {
          const params = new URLSearchParams({
            token: data.token,
            sessionId: data.sessionId,
            url: data.url || '',
            agentName,
          });
          router.push(`/coaching/session?${params.toString()}`);
        }
      } catch (err) {
        console.error('Failed to start coaching session:', err);
        setConnecting(false);
      }
    },
    [router]
  );

  if (connecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-muted)] text-sm">Connecting to coach...</p>
        </div>
      </div>
    );
  }

  return <CoachingAgentSelector onSelect={handleSelect} />;
}
