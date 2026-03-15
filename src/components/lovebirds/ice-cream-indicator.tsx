'use client';

type Phase = {
  id: string;
  label: string;
  timeRange: string;
  color: string;
};

const PHASES: Phase[] = [
  { id: 'first-lick', label: 'First Lick', timeRange: '0-3 min', color: '#1a4a42' },
  { id: 'scoops', label: 'Scoops', timeRange: '3-6 min', color: '#d4a050' },
  { id: 'the-cone', label: 'The Cone', timeRange: '6-8 min', color: '#c46a3a' },
  { id: 'drip', label: 'Drip', timeRange: '8+ min', color: '#6b5b8d' },
  { id: 'tijoux', label: 'Tijoux', timeRange: 'Handoff', color: '#3b1a5e' },
];

function getPhaseFromTimer(timerSeconds: number): string {
  if (timerSeconds < 180) return 'first-lick';
  if (timerSeconds < 360) return 'scoops';
  if (timerSeconds < 480) return 'the-cone';
  return 'drip';
}

type IceCreamIndicatorProps = {
  currentPhase?: string;
  timerSeconds?: number;
  className?: string;
};

export function IceCreamIndicator({ currentPhase, timerSeconds, className = '' }: IceCreamIndicatorProps) {
  const phaseMap: Record<string, number> = {
    'First Lick': 0,
    'first-lick': 0,
    'Scoops': 1,
    'scoops': 1,
    'The Cone': 2,
    'the-cone': 2,
    'Drip': 3,
    'drip': 3,
    'Tijoux': 4,
    'tijoux': 4,
  };

  let activeIdx: number;
  if (currentPhase && phaseMap[currentPhase] !== undefined) {
    activeIdx = phaseMap[currentPhase];
  } else if (timerSeconds !== undefined) {
    const derived = getPhaseFromTimer(timerSeconds);
    activeIdx = phaseMap[derived] ?? 0;
  } else {
    activeIdx = 0;
  }

  return (
    <div className={`flex items-center justify-center gap-1 px-4 py-2 bg-[var(--surface)]/50 border-t border-b border-[var(--border)] ${className}`}>
      {PHASES.map((phase, i) => {
        const isActive = i === activeIdx;
        const isCompleted = i < activeIdx;
        const isUpcoming = i > activeIdx;

        return (
          <div key={phase.id} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className="w-6 h-0.5 rounded"
                style={{
                  backgroundColor: isCompleted || isActive ? phase.color : 'var(--border)',
                  opacity: isUpcoming ? 0.3 : 1,
                }}
              />
            )}
            <div className="flex flex-col items-center gap-0.5">
              <div
                className="w-3 h-3 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: isActive || isCompleted ? phase.color : 'transparent',
                  borderColor: phase.color,
                  opacity: isUpcoming ? 0.3 : 1,
                  boxShadow: isActive ? `0 0 8px ${phase.color}60` : 'none',
                }}
              />
              <span
                className="text-[9px] whitespace-nowrap"
                style={{
                  color: isActive ? phase.color : isCompleted ? 'var(--text-muted)' : 'var(--border)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {phase.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
