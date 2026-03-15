'use client';

import { useState, useEffect } from 'react';

type PastSession = {
  id: string;
  date: string;
  duration: string;
  themes: string[];
  tijouxReflectionSnippet: string;
};

type PatternsData = {
  themes: string[];
  escalationTrend: number[];
  sessionCount: number;
  narrative?: string;
};

type CoupleHistoryProps = {
  coupleId: string;
  className?: string;
};

export function CoupleHistory({ coupleId, className = '' }: CoupleHistoryProps) {
  const [sessions, setSessions] = useState<PastSession[]>([]);
  const [patterns, setPatterns] = useState<PatternsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const [patternsRes] = await Promise.all([
          fetch(`/api/lovebirds/couple/${coupleId}/patterns`),
        ]);
        if (patternsRes.ok) {
          const data = await patternsRes.json();
          setPatterns(data);
          setSessions(data.sessions ?? []);
        }
      } catch {
        // Graceful fallback
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [coupleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {patterns?.narrative && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-sm font-medium text-[var(--text)] mb-2">Cross-Session Patterns</h3>
          <p className="text-sm text-[var(--text-muted)]">{patterns.narrative}</p>
        </div>
      )}

      {patterns?.themes && patterns.themes.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-sm font-medium text-[var(--text)] mb-2">Recurring Themes</h3>
          <div className="flex flex-wrap gap-2">
            {patterns.themes.map((theme, i) => (
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

      {patterns?.escalationTrend && patterns.escalationTrend.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
          <h3 className="text-sm font-medium text-[var(--text)] mb-3">Escalation Across Sessions</h3>
          <div className="flex items-end gap-2 h-20">
            {patterns.escalationTrend.map((val, i) => {
              const color = val < 0.4 ? '#22c55e' : val < 0.7 ? '#f59e0b' : '#ef4444';
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height: `${Math.max(val * 100, 8)}%`,
                      backgroundColor: color,
                      minHeight: 4,
                    }}
                  />
                  <span className="text-[8px] text-[var(--text-muted)]">S{i + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-[var(--text)]">Past Sessions</h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No past sessions found.</p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{session.date}</span>
                <span>{session.duration}</span>
              </div>
              {session.themes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {session.themes.map((t, i) => (
                    <span key={i} className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--border)] text-[var(--text-muted)]">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {session.tijouxReflectionSnippet && (
                <p className="text-xs text-[var(--text-muted)] italic line-clamp-2">
                  {session.tijouxReflectionSnippet}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
