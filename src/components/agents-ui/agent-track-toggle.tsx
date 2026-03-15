'use client';

type Props = {
  trackSource: 'microphone' | 'camera';
  enabled?: boolean;
  onToggle?: () => void;
  className?: string;
  children?: React.ReactNode;
};

export function AgentTrackToggle({ trackSource, enabled = true, onToggle, className = '', children }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
        enabled
          ? 'bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--border)]'
          : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
      } ${className}`}
      title={`${enabled ? 'Mute' : 'Unmute'} ${trackSource}`}
    >
      {children || (
        <span className="text-xs">
          {trackSource === 'microphone' ? (enabled ? 'Mic' : 'Muted') : (enabled ? 'Cam' : 'Off')}
        </span>
      )}
    </button>
  );
}
