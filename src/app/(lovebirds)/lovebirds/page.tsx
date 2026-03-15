'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

export default function LovebirdsPage() {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);

  const handleStart = useCallback(async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'lovebirds',
          agentName: 'LuvByrds',
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
        router.push(`/lovebirds/session?${params.toString()}`);
      }
    } catch (err) {
      console.error('Failed to start Lovebirds session:', err);
      setConnecting(false);
    }
  }, [router]);

  if (connecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-muted)] text-sm">Setting up your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <Heart className="w-8 h-8 text-[var(--primary)] mx-auto" />
          <h1 className="text-3xl font-bold text-[var(--text)]">Lovebirds</h1>
          <p className="text-[var(--text-muted)] text-sm">AI couples mediation with Raven Voss</p>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity"
        >
          Start Session
        </button>
      </div>
    </div>
  );
}
