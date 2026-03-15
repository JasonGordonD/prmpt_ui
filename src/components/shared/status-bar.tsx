'use client';

import type { RemoteParticipant } from 'livekit-client';
import { useNodeState } from '@/hooks/use-node-state';
import { useSentiment } from '@/hooks/use-sentiment';
import { useSessionTimer } from '@/hooks/use-session-timer';
import type { AgentConfig } from '@/lib/agents';

type StatusBarProps = {
  agentParticipant: RemoteParticipant | undefined;
  agentConfig: AgentConfig;
  isConnected: boolean;
  isFinished: boolean;
  className?: string;
  onEscalationChange?: (escalation: number) => void;
};

export function StatusBar({
  agentParticipant,
  agentConfig,
  isConnected,
  isFinished,
  className = '',
}: StatusBarProps) {
  const nodeState = useNodeState(agentParticipant, agentConfig.nodeMap);
  const sentiment = useSentiment(agentParticipant);
  const timer = useSessionTimer(isConnected, isFinished);
  const activeModel = agentParticipant?.attributes?.active_model;

  const trajectoryArrow =
    sentiment?.trajectory === 'rising' ? '\u25B2' :
    sentiment?.trajectory === 'falling' ? '\u25BC' : '\u2192';

  return (
    <div
      className={`flex items-center gap-4 px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)] text-xs flex-wrap ${className}`}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: nodeState?.color ?? '#888' }}
        />
        <span className="text-[var(--text)]">{nodeState?.label ?? '\u2014'}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[var(--text-muted)]">LLM:</span>
        <span className="font-mono text-[var(--text)]">{activeModel ?? '\u2014'}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[var(--text-muted)]">Sentiment:</span>
        <span className="text-[var(--text)]">
          {sentiment
            ? `${sentiment.primaryEmotion} ${sentiment.confidence.toFixed(2)} ${trajectoryArrow}`
            : '\u2014'}
        </span>
      </div>

      <div className="ml-auto font-mono text-[var(--text)]">{timer}</div>
    </div>
  );
}
