'use client';

import { useMemo } from 'react';
import { useAgent } from '@livekit/components-react';
import type { AgentState } from '@livekit/components-react';
import { useSessionTimer } from '@/hooks/use-session-timer';
import type { AgentConfig } from '@/lib/agents';

type StatusBarProps = {
  agentConfig: AgentConfig;
  className?: string;
};

type StateDotInfo = {
  color: string;
  label: string;
  pulse: boolean;
};

function getStateDot(state: AgentState): StateDotInfo {
  switch (state) {
    case 'connecting':
    case 'pre-connect-buffering':
    case 'initializing':
    case 'idle':
      return { color: '#888', label: 'Connecting...', pulse: true };
    case 'listening':
      return { color: '#22c55e', label: 'Listening', pulse: false };
    case 'thinking':
      return { color: '#f59e0b', label: 'Thinking', pulse: false };
    case 'speaking':
      return { color: '#3b82f6', label: 'Speaking', pulse: false };
    case 'disconnected':
      return { color: '#ef4444', label: 'Disconnected', pulse: false };
    case 'failed':
      return { color: '#ef4444', label: 'Failed', pulse: false };
    default:
      return { color: '#888', label: '—', pulse: false };
  }
}

function parseSentiment(raw: string | undefined): { emotion: string; confidence: number } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return {
      emotion: parsed.primary_emotion ?? parsed.primaryEmotion ?? '—',
      confidence: parsed.confidence ?? 0,
    };
  } catch {
    return null;
  }
}

export function StatusBar({ agentConfig, className = '' }: StatusBarProps) {
  const agent = useAgent();
  const timer = useSessionTimer(agent.isConnected, agent.isFinished);

  const stateDot = useMemo(() => getStateDot(agent.state), [agent.state]);

  // Read participant attributes (published by backend agent)
  const attributes = agent.attributes;
  const currentNode = attributes?.current_node;
  const activeModel = attributes?.active_model;
  const sentimentRaw = attributes?.sentiment_data;

  // Map node through nodeMap
  const nodeDisplay = useMemo(() => {
    if (!currentNode) return null;
    const mapped = agentConfig.nodeMap[currentNode];
    return mapped
      ? { label: mapped.label, color: mapped.color }
      : { label: currentNode, color: '#888' };
  }, [currentNode, agentConfig.nodeMap]);

  // Parse sentiment
  const sentiment = useMemo(() => parseSentiment(sentimentRaw), [sentimentRaw]);

  return (
    <div
      className={`flex items-center gap-4 px-4 py-2.5 bg-[var(--surface)] border-b border-[var(--border)] text-xs flex-wrap min-h-[40px] shrink-0 ${className}`}
    >
      {/* Agent state indicator — always shown */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full shrink-0 ${stateDot.pulse ? 'animate-pulse-subtle' : ''}`}
          style={{ backgroundColor: stateDot.color }}
        />
        <span className="text-[13px] font-medium text-[var(--text)]">
          {stateDot.label}
        </span>
      </div>

      {/* Node indicator — only shown when agent publishes current_node */}
      {nodeDisplay && (
        <div className="flex items-center gap-1.5">
          <span
            className="px-2 py-0.5 text-[11px] font-medium rounded-lg"
            style={{
              backgroundColor: `${nodeDisplay.color}20`,
              color: nodeDisplay.color,
            }}
          >
            {nodeDisplay.label}
          </span>
        </div>
      )}

      {/* LLM model indicator — only shown when agent publishes active_model */}
      {activeModel && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-[var(--text-muted)]">LLM:</span>
          <span className="text-[13px] font-medium font-mono text-[var(--text)]">
            {activeModel}
          </span>
        </div>
      )}

      {/* Sentiment display — only shown when agent publishes sentiment_data */}
      {sentiment && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-[var(--text-muted)]">Sentiment:</span>
          <span className="text-[13px] font-medium text-[var(--text)]">
            {sentiment.emotion} {sentiment.confidence.toFixed(2)}
          </span>
        </div>
      )}

      {/* Timer — always shown */}
      <div className="ml-auto font-mono text-[13px] font-medium text-[var(--text)] tabular-nums">
        {timer}
      </div>
    </div>
  );
}
