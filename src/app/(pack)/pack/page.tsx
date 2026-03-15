'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function PackPage() {
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
          agentId: 'pack',
          agentName: 'the-pack',
        }),
      });
      const data = await res.json();
      if (data.token) {
        const params = new URLSearchParams({
          token: data.token,
          sessionId: data.sessionId,
          url: data.livekitUrl || '',
        });
        router.push(`/pack/session?${params.toString()}`);
      } else {
        setError(data.error || 'Failed to connect. Please try again.');
        setConnecting(false);
      }
    } catch (err) {
      console.error('Failed to start Pack session:', err);
      setError('Could not connect. Check your internet connection.');
      setConnecting(false);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[400px] space-y-6 text-center">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-[var(--text)]">The Pack</h1>
          <p className="text-[var(--text-muted)] text-sm">
            Multi-agent voice experience
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-600/10 border border-red-600/20 text-sm text-red-400 animate-fade-in">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={connecting}
          className="w-full py-3 rounded-lg bg-[var(--primary)] text-white font-medium btn-interactive min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {connecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
              Connecting...
            </>
          ) : (
            'Start Session'
          )}
        </button>
      </div>
    </div>
  );
}
