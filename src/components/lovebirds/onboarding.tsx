'use client';

import { useState, useCallback } from 'react';
import { Heart, Users } from 'lucide-react';

type OnboardingProps = {
  onStart: (partnerA: string, partnerB: string, returningCoupleId?: string) => void;
};

type CoupleData = {
  found: boolean;
  sessionCount: number;
  lastSessionDate: string;
  coupleId: string;
};

export function LovebirdsOnboarding({ onStart }: OnboardingProps) {
  const [partnerA, setPartnerA] = useState('');
  const [partnerB, setPartnerB] = useState('');
  const [returning, setReturning] = useState(false);
  const [coupleData, setCoupleData] = useState<CoupleData | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);

  const handleLookup = useCallback(async () => {
    if (!partnerA.trim() || !partnerB.trim()) return;
    setLookupLoading(true);
    try {
      const params = new URLSearchParams({
        partner_a: partnerA.trim(),
        partner_b: partnerB.trim(),
      });
      const res = await fetch(`/api/lovebirds/couple/lookup?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCoupleData(data);
      }
    } catch {
      setCoupleData(null);
    } finally {
      setLookupLoading(false);
      setLookupDone(true);
    }
  }, [partnerA, partnerB]);

  const handleToggleReturning = () => {
    const next = !returning;
    setReturning(next);
    if (next && partnerA.trim() && partnerB.trim()) {
      handleLookup();
    } else {
      setCoupleData(null);
      setLookupDone(false);
    }
  };

  const canStart = partnerA.trim() && partnerB.trim();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Heart className="w-8 h-8 text-[var(--primary)]" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Lovebirds</h1>
          <p className="text-[var(--text-muted)] text-sm">AI couples mediation with Raven Voss</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Partner A name</label>
            <input
              type="text"
              value={partnerA}
              onChange={(e) => setPartnerA(e.target.value)}
              placeholder="First name"
              className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Partner B name</label>
            <input
              type="text"
              value={partnerB}
              onChange={(e) => setPartnerB(e.target.value)}
              placeholder="First name"
              className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors"
              required
            />
          </div>

          <button
            onClick={handleToggleReturning}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors w-full justify-center ${
              returning
                ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
            }`}
          >
            <Users className="w-4 h-4" />
            {returning ? 'Returning couple' : "We've been here before"}
          </button>

          {returning && lookupDone && (
            <div className="animate-fade-in px-4 py-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm">
              {lookupLoading ? (
                <span className="text-[var(--text-muted)]">Looking up your history...</span>
              ) : coupleData?.found ? (
                <div className="text-[var(--text-muted)] space-y-1">
                  <p>Welcome back. Raven remembers your last session on {coupleData.lastSessionDate}.</p>
                  <p>You have had {coupleData.sessionCount} session{coupleData.sessionCount !== 1 ? 's' : ''} together.</p>
                </div>
              ) : (
                <span className="text-[var(--text-muted)]">No previous sessions found.</span>
              )}
            </div>
          )}

          <button
            onClick={() => onStart(partnerA.trim(), partnerB.trim(), coupleData?.found ? coupleData.coupleId : undefined)}
            disabled={!canStart}
            className="w-full py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Session
          </button>
        </div>
      </div>
    </div>
  );
}
