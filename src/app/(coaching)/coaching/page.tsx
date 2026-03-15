'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const COACHING_VARIANTS = [
  { label: 'Ara Thompson (DC)', agentName: 'exec-coach-primary' },
  { label: 'Ara Thompson (Toronto)', agentName: 'exec-coach-primary' },
  { label: 'Ara Thompson (Global)', agentName: 'exec-coach-primary' },
  { label: 'Ara Thompson (Dark Mode)', agentName: 'exec-coach-primary' },
  { label: 'Central Routing', agentName: 'exec-coach-primary' },
];

export default function CoachingPage() {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('exec-coach-primary');

  const handleStart = useCallback(async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'coaching',
          agentName: selectedAgent,
        }),
      });
      const data = await res.json();
      if (data.token) {
        const params = new URLSearchParams({
          token: data.token,
          sessionId: data.sessionId,
          url: data.livekitUrl || '',
          agentName: selectedAgent,
        });
        router.push(`/coaching/session?${params.toString()}`);
      }
    } catch (err) {
      console.error('Failed to start coaching session:', err);
      setConnecting(false);
    }
  }, [router, selectedAgent]);

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-[var(--text)]">Executive Coaching</h1>
          <p className="text-[var(--text-muted)] text-sm">Premium executive coaching with Ara Thompson</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">
              Coaching variant (optional)
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] outline-none focus:border-[var(--primary)] transition-colors appearance-none cursor-pointer"
            >
              {COACHING_VARIANTS.map((v) => (
                <option key={v.label} value={v.agentName}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity"
          >
            Start Session
          </button>
        </div>
      </div>
    </div>
  );
}
