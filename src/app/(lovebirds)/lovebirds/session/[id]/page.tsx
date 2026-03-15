'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { PostSessionBase } from '@/components/shared/post-session-base';
import { TijouxReflectionCard } from '@/components/lovebirds/tijoux-reflection-card';
import { Heart } from 'lucide-react';

type SessionData = {
  summary?: string;
  themes?: string[];
  tijouxReflection?: string;
  scorekeeperFinal?: {
    partnerA: { name: string; talkTime: number; turns: number };
    partnerB: { name: string; talkTime: number; turns: number };
    peakEscalation: number;
    interventionCount: number;
  };
  duration?: string;
};

type PartnerFact = {
  partner: string;
  facts: string[];
};

export default function LovebirdsPostSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [partnerFacts, setPartnerFacts] = useState<PartnerFact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sessionRes, factsRes] = await Promise.all([
          fetch(`/api/lovebirds/session/${id}`),
          fetch(`/api/lovebirds/session/${id}/partner-facts`),
        ]);

        if (sessionRes.ok) {
          const data = await sessionRes.json();
          setSessionData(data);
        }
        if (factsRes.ok) {
          const facts = await factsRes.json();
          setPartnerFacts(facts.facts ?? []);
        }
      } catch {
        // Graceful fallback
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <PostSessionBase
        duration={sessionData?.duration}
        summary={sessionData?.summary}
        transcript={sessionData?.summary}
      >
        {sessionData?.tijouxReflection && (
          <TijouxReflectionCard reflection={sessionData.tijouxReflection} />
        )}

        {sessionData?.summary && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium text-[var(--text)]">Session Summary</h3>
            <p className="text-sm text-[var(--text-muted)]">{sessionData.summary}</p>
          </div>
        )}

        {sessionData?.themes && sessionData.themes.length > 0 && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium text-[var(--text)]">Themes</h3>
            <div className="flex flex-wrap gap-2">
              {sessionData.themes.map((theme, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs rounded-full bg-[var(--primary)]/20 text-[var(--primary)]"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {partnerFacts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partnerFacts.map((pf, i) => (
              <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 space-y-2">
                <h3 className="text-sm font-medium text-[var(--text)]">{pf.partner}</h3>
                <ul className="space-y-1">
                  {pf.facts.map((fact, j) => (
                    <li key={j} className="text-xs text-[var(--text-muted)] flex items-start gap-1.5">
                      <span className="text-[var(--primary)] mt-0.5">-</span>
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {sessionData?.scorekeeperFinal && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-[var(--text)]">Final Stats</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[var(--text-muted)]">{sessionData.scorekeeperFinal.partnerA.name}</span>
                <div className="text-[var(--text)]">Talk time: {Math.floor(sessionData.scorekeeperFinal.partnerA.talkTime / 60)}m {sessionData.scorekeeperFinal.partnerA.talkTime % 60}s</div>
                <div className="text-[var(--text)]">Turns: {sessionData.scorekeeperFinal.partnerA.turns}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[var(--text-muted)]">{sessionData.scorekeeperFinal.partnerB.name}</span>
                <div className="text-[var(--text)]">Talk time: {Math.floor(sessionData.scorekeeperFinal.partnerB.talkTime / 60)}m {sessionData.scorekeeperFinal.partnerB.talkTime % 60}s</div>
                <div className="text-[var(--text)]">Turns: {sessionData.scorekeeperFinal.partnerB.turns}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
              <span>Peak escalation: {sessionData.scorekeeperFinal.peakEscalation.toFixed(2)}</span>
              <span>Interventions: {sessionData.scorekeeperFinal.interventionCount}</span>
            </div>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <button
            onClick={() => router.push('/lovebirds')}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--primary)] text-white font-medium btn-interactive min-h-[48px]"
          >
            <Heart className="w-4 h-4" />
            Book Another Session
          </button>
        </div>
      </PostSessionBase>
    </div>
  );
}
