'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { PostSessionBase } from '@/components/shared/post-session-base';
import { Calendar } from 'lucide-react';

type SessionData = {
  summary?: string;
  duration?: string;
  framework?: string;
  insights?: string[];
  themes?: string[];
};

export default function CoachingPostSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/coaching/session/${id}`);
        if (res.ok) {
          const data = await res.json();
          setSessionData(data);
        }
      } catch {
        // Graceful fallback
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
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
        {sessionData?.summary && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium text-[var(--text)]">Session Summary</h3>
            <p className="text-sm text-[var(--text-muted)]">{sessionData.summary}</p>
          </div>
        )}

        {sessionData?.framework && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium text-[var(--text)]">Framework Applied</h3>
            <span className="inline-block px-2 py-1 text-xs rounded bg-[var(--primary)] text-white">
              {sessionData.framework}
            </span>
          </div>
        )}

        {sessionData?.insights && sessionData.insights.length > 0 && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium text-[var(--text)]">Key Insights &amp; Action Items</h3>
            <ul className="space-y-1.5">
              {sessionData.insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                  <span className="text-[var(--primary)] mt-0.5">-</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <button
            onClick={() => router.push('/coaching')}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--primary)] text-white font-medium btn-interactive min-h-[48px]"
          >
            <Calendar className="w-4 h-4" />
            Schedule Next Session
          </button>
        </div>
      </PostSessionBase>
    </div>
  );
}
