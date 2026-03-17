'use client';

import type { AgentState } from '@livekit/components-react';

export function AgentChatIndicator({ agentState }: { agentState?: AgentState }) {
  if (agentState !== 'thinking') {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse-subtle"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-[var(--text-muted)]">Thinking…</span>
    </div>
  );
}
