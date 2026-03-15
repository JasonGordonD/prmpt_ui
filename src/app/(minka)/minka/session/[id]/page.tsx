'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { PostSessionBase } from '@/components/shared/post-session-base';
import { Phone } from 'lucide-react';

type SessionData = {
  summary?: string;
  duration?: string;
  nodeTransitions?: string[];
  themes?: string[];
};

export default function MinkaPostSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/minka/session/${id}`);
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

        {sessionData?.nodeTransitions && sessionData.nodeTransitions.length > 0 && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium text-[var(--text)]">Session Flow</h3>
            <div className="flex flex-wrap gap-2">
              {sessionData.nodeTransitions.map((node, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs rounded bg-[var(--bg)] text-[var(--text-muted)] border border-[var(--border)]"
                >
                  {node}
                </span>
              ))}
            </div>
          </div>
        )}

        {sessionData?.themes && sessionData.themes.length > 0 && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium text-[var(--text)]">Themes</h3>
            <div className="flex flex-wrap gap-2">
              {sessionData.themes.map((theme, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs rounded-full text-white"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <button
            onClick={() => router.push('/minka')}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Phone className="w-4 h-4" />
            Call Again
          </button>
        </div>
      </PostSessionBase>
    </div>
  );
}
