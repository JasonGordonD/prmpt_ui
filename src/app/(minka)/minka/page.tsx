'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Phone } from 'lucide-react';

export default function MinkaPage() {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);

  const handleStart = useCallback(async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'minka',
          agentName: 'minka-moor-primary',
          metadata: {},
        }),
      });
      const data = await res.json();
      if (data.token) {
        const params = new URLSearchParams({
          token: data.token,
          sessionId: data.sessionId,
          url: data.livekitUrl || '',
        });
        router.push(`/minka/session?${params.toString()}`);
      }
    } catch (err) {
      console.error('Failed to start session:', err);
      setConnecting(false);
    }
  }, [router]);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-[var(--text)]">Minka Moor</h1>
        <p className="text-[var(--text-muted)] text-sm">Voice experience</p>
      </div>

      <button
        onClick={handleStart}
        className="w-full max-w-sm flex items-center justify-center gap-2 py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity"
      >
        <Phone className="w-4 h-4" />
        Call Minka
      </button>
    </div>
  );
}
