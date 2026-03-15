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
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[var(--text-muted)]">Escalation</span>
        <span style={{ color }}>{value.toFixed(2)}</span>
      </div>
      <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
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
        <p className="text-xs text-[var(--text-muted)]">{'\u2014'}</p>
      </div>
    );
  }

  const totalTalkTime = data.partnerA.talkTime + data.partnerB.talkTime;
  const pctA = totalTalkTime > 0 ? (data.partnerA.talkTime / totalTalkTime) * 100 : 50;
  const pctB = totalTalkTime > 0 ? (data.partnerB.talkTime / totalTalkTime) * 100 : 50;

  return (
    <div className={`p-4 space-y-4 ${isPaused ? 'opacity-50' : ''} ${className}`}>
      <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Scorekeeper</h3>

      {isPaused && (
        <div className="text-xs text-[#6b5b8d] text-center py-1 animate-pulse-subtle">
          Paused -- clinical closing in progress
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: '#c46a3a' }}>{data.partnerA.name}</span>
            <span className="text-[var(--text-muted)]">{pctA.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pctA}%`, backgroundColor: '#c46a3a' }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: '#1a4a42' }}>{data.partnerB.name}</span>
            <span className="text-[var(--text-muted)]">{pctB.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pctB}%`, backgroundColor: '#1a4a42' }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>{data.partnerA.name}: {data.partnerA.turns} turns</span>
        <span>{data.partnerB.name}: {data.partnerB.turns} turns</span>
      </div>

      {data.consecutiveCount >= 3 && (
        <div className="px-2 py-1.5 rounded text-xs text-amber-400 bg-amber-400/10 text-center animate-fade-in">
          {data.consecutiveSpeaker}: {data.consecutiveCount} consecutive {'\u25B2'}
        </div>
      )}

      <EscalationMeter value={data.escalation} />
    </div>
  );
}
