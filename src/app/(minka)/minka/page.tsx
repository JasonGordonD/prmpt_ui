'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Phone } from 'lucide-react';

export default function MinkaPage() {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleStart = useCallback(async () => {
    setConnecting(true);
    setError('');
    try {
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'minka',
          agentName: 'minka-moor-primary',
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
      } else {
        setError(data.error || 'Failed to connect. Please try again.');
        setConnecting(false);
      }
    } catch (err) {
      console.error('Failed to start session:', err);
      setError('Could not connect. Check your internet connection.');
      setConnecting(false);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[400px] space-y-6 text-center">
        <div className="space-y-3">
          <h1 className="text-5xl font-display font-semibold text-[var(--noir-text)]">Minka Moor</h1>
          <p className="text-[var(--noir-text-muted)] text-xs uppercase tracking-[0.16em] font-mono">Voice experience</p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-600/10 border border-red-600/20 text-sm text-red-400 animate-fade-in">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={connecting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-[var(--noir-accent)] bg-[rgba(7,7,10,0.78)] text-[var(--noir-accent-bright)] font-mono text-xs uppercase tracking-[0.16em] btn-interactive min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--noir-accent-dim)]"
        >
          {connecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
              Connecting...
            </>
          ) : (
            <>
              <Phone className="w-4 h-4" />
              Call Minka
            </>
          )}
        </button>
      </div>
    </div>
  );
}
