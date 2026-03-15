'use client';

import type { ScorekeeperData } from '@/hooks/use-scorekeeper';

type ScorekeeperProps = {
  data: ScorekeeperData | null;
  isPaused?: boolean;
  className?: string;
};

function EscalationMeter({ value }: { value: number }) {
  const color = value < 0.4 ? '#22c55e' : value < 0.7 ? '#f59e0b' : '#ef4444';
  const percentage = Math.min(value * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[var(--text-muted)]">Escalation</span>
        <span style={{ color }} className="tabular-nums">{value.toFixed(2)}</span>
      </div>
      <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            transition: 'width 300ms ease-out, background-color 500ms ease',
          }}
        />
      </div>
    </div>
  );
}

export function Scorekeeper({ data, isPaused = false, className = '' }: ScorekeeperProps) {
  if (!data) {
    return (
      <div className={`p-4 space-y-3 ${className}`}>
        <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Scorekeeper</h3>
        <p className="text-xs text-[var(--text-muted)] animate-pulse-subtle">Listening...</p>
      </div>
    );
  }

  const totalTalkTime = data.partnerA.talkTime + data.partnerB.talkTime;
  const pctA = totalTalkTime > 0 ? (data.partnerA.talkTime / totalTalkTime) * 100 : 50;
  const pctB = totalTalkTime > 0 ? (data.partnerB.talkTime / totalTalkTime) * 100 : 50;

  return (
    <div
      className={`p-4 space-y-4 ${className}`}
      style={{
        opacity: isPaused ? 0.5 : 1,
        transition: 'opacity 500ms ease',
      }}
    >
      <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Scorekeeper</h3>

      {isPaused && (
        <div className="text-xs text-[#6b5b8d] text-center py-1 animate-pulse-subtle">
          Paused — clinical closing
        </div>
      )}

      {/* Talk time bars */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: '#c46a3a' }}>{data.partnerA.name}</span>
            <span className="text-[var(--text-muted)] tabular-nums">{pctA.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pctA}%`,
                backgroundColor: '#c46a3a',
                transition: 'width 300ms ease-out',
              }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: '#1a4a42' }}>{data.partnerB.name}</span>
            <span className="text-[var(--text-muted)] tabular-nums">{pctB.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pctB}%`,
                backgroundColor: '#1a4a42',
                transition: 'width 300ms ease-out',
              }}
            />
          </div>
        </div>
      </div>

      {/* Turn counts */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{data.partnerA.name}: {data.partnerA.turns} turns</span>
        <span>{data.partnerB.name}: {data.partnerB.turns} turns</span>
      </div>

      {/* Consecutive turn warning */}
      {data.consecutiveCount >= 3 && (
        <div className="px-2 py-1.5 rounded-lg text-xs text-amber-400 bg-amber-400/10 text-center animate-fade-in">
          {data.consecutiveSpeaker}: {data.consecutiveCount} consecutive ▲
        </div>
      )}

      <EscalationMeter value={data.escalation} />
    </div>
  );
}

/* ─── Compact variant for mobile ─── */

export function ScorekeeperCompact({ data, isPaused = false, className = '' }: ScorekeeperProps) {
  if (!data) {
    return (
      <div className={`flex items-center gap-4 px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)] text-xs ${className}`}>
        <span className="text-[var(--text-muted)] animate-pulse-subtle">Scorekeeper: Listening...</span>
      </div>
    );
  }

  const totalTalkTime = data.partnerA.talkTime + data.partnerB.talkTime;
  const pctA = totalTalkTime > 0 ? (data.partnerA.talkTime / totalTalkTime) * 100 : 50;
  const escColor = data.escalation < 0.4 ? '#22c55e' : data.escalation < 0.7 ? '#f59e0b' : '#ef4444';

  return (
    <div
      className={`flex items-center gap-4 px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)] text-xs ${className}`}
      style={{ opacity: isPaused ? 0.5 : 1, transition: 'opacity 500ms ease' }}
    >
      {/* Talk time mini bar */}
      <div className="flex items-center gap-2 flex-1">
        <span style={{ color: '#c46a3a' }} className="text-[11px] font-medium">{data.partnerA.name}</span>
        <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden max-w-[100px]">
          <div
            className="h-full rounded-full"
            style={{ width: `${pctA}%`, backgroundColor: '#c46a3a', transition: 'width 300ms ease-out' }}
          />
        </div>
        <span style={{ color: '#1a4a42' }} className="text-[11px] font-medium">{data.partnerB.name}</span>
      </div>

      {/* Escalation */}
      <div className="flex items-center gap-1.5">
        <span className="text-[var(--text-muted)]">Esc:</span>
        <span style={{ color: escColor }} className="tabular-nums font-medium">{data.escalation.toFixed(2)}</span>
      </div>

      {/* Consecutive warning */}
      {data.consecutiveCount >= 3 && (
        <span className="text-amber-400 text-[11px] animate-pulse-subtle">
          {data.consecutiveSpeaker} ×{data.consecutiveCount}
        </span>
      )}
    </div>
  );
}
