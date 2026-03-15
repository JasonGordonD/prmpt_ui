'use client';

type Props = {
  isActive?: boolean;
  className?: string;
};

export function AgentChatIndicator({ isActive = false, className = '' }: Props) {
  if (!isActive) return null;

  return (
    <div className={`flex items-center gap-1 px-2 py-1 ${className}`}>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse-subtle"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-[var(--text-muted)]">Agent is typing...</span>
    </div>
  );
}
