'use client';

export function AgentChatIndicator({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dotSize = size === 'lg' ? 'h-2.5 w-2.5' : size === 'md' ? 'h-2 w-2' : 'h-1.5 w-1.5';
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 animate-fade-in">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`${dotSize} rounded-full bg-[var(--primary)] animate-pulse-subtle`}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-[var(--text-muted)]">Thinking...</span>
    </div>
  );
}
