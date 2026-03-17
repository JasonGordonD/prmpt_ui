'use client';

import { useAgent } from '@livekit/components-react';
import { useSessionTimer } from '@/hooks/use-session-timer';
import type { AgentConfig } from '@/lib/agents';

type StatusBarProps = {
  agentConfig: AgentConfig;
  className?: string;
};

function StateIndicator({ state }: { state: string }) {
  if (state === 'listening') {
    return <span className="status-state-dot status-state-dot-listening" aria-label="Listening" />;
  }

  if (state === 'thinking') {
    return (
      <div className="status-state-thinking" aria-label="Thinking">
        {[0, 1, 2].map((index) => (
          <span key={index} className="status-state-thinking-dot" style={{ animationDelay: `${index * 300}ms` }} />
        ))}
      </div>
    );
  }

  if (state === 'speaking') {
    return (
      <div className="status-state-speaking" aria-label="Speaking">
        {[0, 1, 2, 3, 4].map((index) => (
          <span key={index} className="status-state-speaking-bar" style={{ animationDelay: `${index * 120}ms` }} />
        ))}
      </div>
    );
  }

  return <span className="status-state-dot status-state-dot-idle" aria-label="Idle" />;
}

export function StatusBar({ agentConfig, className = '' }: StatusBarProps) {
  const agent = useAgent();
  const timer = useSessionTimer(agent.isConnected, agent.isFinished);
  const currentNode = agent.attributes?.current_node || 'idle';

  return (
    <div className={`status-bar grid h-10 min-h-10 grid-cols-[1fr_auto_1fr] items-center px-4 ${className}`}>
      <div className="min-w-0 overflow-hidden">
        <div className="truncate font-mono text-[10px] uppercase tracking-[0.15em]">
          <span className="text-[var(--noir-text-muted)]">{agentConfig.displayName}</span>
          <span className="mx-2 text-[var(--noir-accent)]">·</span>
          <span className="text-[var(--noir-text-dim)]">{currentNode.toLowerCase()}</span>
        </div>
      </div>

      <div className="mx-4 flex items-center justify-center">
        <StateIndicator state={agent.state} />
      </div>

      <div className="flex justify-end font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--noir-text-muted)] tabular-nums">
        {timer}
      </div>
    </div>
  );
}
