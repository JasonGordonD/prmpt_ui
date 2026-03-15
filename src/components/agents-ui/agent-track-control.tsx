'use client';

type Props = {
  trackSource: 'microphone' | 'camera';
  className?: string;
};

export function AgentTrackControl({ trackSource, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-xs text-[var(--text-muted)]">
        {trackSource === 'microphone' ? 'Microphone' : 'Camera'}
      </label>
      <select
        className="bg-[var(--surface)] text-[var(--text)] text-xs border border-[var(--border)] rounded px-2 py-1 outline-none"
        title={`Select ${trackSource}`}
      >
        <option>Default {trackSource}</option>
      </select>
    </div>
  );
}
