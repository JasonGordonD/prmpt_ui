'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MinkaWelcome } from '@/components/minka/welcome';

export default function MinkaPage() {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);

  const handleStart = useCallback(
    async (callerName: string) => {
      setConnecting(true);
      try {
        const res = await fetch('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: 'minka',
            agentName: 'minka-qualification',
            metadata: { caller_name: callerName },
          }),
        });
        const data = await res.json();
        if (data.token) {
          const params = new URLSearchParams({
            token: data.token,
            sessionId: data.sessionId,
            url: data.url || '',
          });
          router.push(`/minka/session?${params.toString()}`);
        }
      } catch (err) {
        console.error('Failed to start session:', err);
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
          <p className="text-[var(--text-muted)] text-sm">Connecting...</p>
        </div>
      </div>
    );
  }

  return <MinkaWelcome onStart={handleStart} />;
}
