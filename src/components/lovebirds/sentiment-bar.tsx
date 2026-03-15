'use client';

import { useEffect, useRef } from 'react';
import type { SentimentData } from '@/hooks/use-sentiment';

type SentimentBarProps = {
  data: SentimentData | null;
  className?: string;
  onEscalationChange?: (escalation: number) => void;
};

export function SentimentBar({ data, className = '', onEscalationChange }: SentimentBarProps) {
  const vulnerabilityRef = useRef<HTMLDivElement>(null);

  const vulnerabilityShift = data?.vulnerabilityShift ?? false;
  const escalation = data?.escalation;

  useEffect(() => {
    if (vulnerabilityShift && vulnerabilityRef.current) {
      vulnerabilityRef.current.style.display = 'flex';
      const timer = setTimeout(() => {
        if (vulnerabilityRef.current) {
          vulnerabilityRef.current.style.display = 'none';
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [vulnerabilityShift]);

  useEffect(() => {
    if (escalation != null) {
      onEscalationChange?.(escalation);
    }
  }, [escalation, onEscalationChange]);

  if (!data) {
    return (
      <div className={`flex items-center gap-4 px-4 py-1.5 bg-[var(--surface)]/50 border-b border-[var(--border)] text-xs ${className}`}>
        <span className="text-[var(--text-muted)]">Sentiment: {'\u2014'}</span>
      </div>
    );
  }

  const trajectoryArrow =
    data.trajectory === 'rising' ? '\u25B2' :
    data.trajectory === 'falling' ? '\u25BC' : '\u2192';

  const trajectoryColor =
    data.trajectory === 'rising' ? 'text-red-400' :
    data.trajectory === 'falling' ? 'text-green-400' : 'text-[var(--text-muted)]';

  return (
    <div className={`flex items-center gap-4 px-4 py-1.5 bg-[var(--surface)]/50 border-b border-[var(--border)] text-xs ${className}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-[var(--text-muted)]">Emotion:</span>
        <span className="text-[var(--text)] font-medium">{data.primaryEmotion}</span>
        <span className="text-[var(--text-muted)]">{data.confidence.toFixed(2)}</span>
      </div>

      <div className={`flex items-center gap-1 ${trajectoryColor}`}>
        <span>Escalation {trajectoryArrow}</span>
      </div>

      <div
        ref={vulnerabilityRef}
        style={{ display: 'none' }}
        className="items-center gap-1 px-2 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)] animate-pulse-subtle"
      >
        Vulnerability detected
      </div>
    </div>
  );
}
