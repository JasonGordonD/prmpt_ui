'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LovebirdsOnboarding } from '@/components/lovebirds/onboarding';

export default function LovebirdsPage() {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);

  const handleStart = useCallback(
    async (partnerA: string, partnerB: string, returningCoupleId?: string) => {
      setConnecting(true);
      try {
        const res = await fetch('/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: 'lovebirds',
            agentName: 'LuvByrds',
            metadata: {
              partner_a: partnerA,
              partner_b: partnerB,
              returning_couple_id: returningCoupleId,
            },
          }),
        });
        const data = await res.json();
        if (data.token) {
          const params = new URLSearchParams({
            token: data.token,
            sessionId: data.sessionId,
            url: data.livekitUrl || '',
            partnerA,
            partnerB,
          });
          router.push(`/lovebirds/session?${params.toString()}`);
        }
      } catch (err) {
        console.error('Failed to start Lovebirds session:', err);
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
          <p className="text-[var(--text-muted)] text-sm">Setting up your session...</p>
        </div>
      </div>
    );
  }

  return <LovebirdsOnboarding onStart={handleStart} />;
}
