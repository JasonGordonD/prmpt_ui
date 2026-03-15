'use client';

import { useRouter } from 'next/navigation';
import { useAgent, useSessionMessages, useSessionContext } from '@livekit/components-react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import type { AgentConfig } from '@/lib/agents';
import type { AgentState } from '@livekit/components-react';
import { ErrorDisplay } from './error-display';
import { PostSessionView } from './post-session-view';
import { StartAudioOverlay } from './session-wrapper';
import { useSessionTimer } from '@/hooks/use-session-timer';
import { useHasEverConnected } from '@/hooks/use-has-ever-connected';

type AgentLifecycleViewProps = {
  agentConfig: AgentConfig;
  children: React.ReactNode;
};

export function AgentLifecycleView({ agentConfig, children }: AgentLifecycleViewProps) {
  const router = useRouter();
  const agent = useAgent();
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const timer = useSessionTimer(agent.isConnected, agent.isFinished);
  const { hasStartedConnecting, hasBeenInteractive } = useHasEverConnected(agent.state);
  const agentStartPath = `/${agentConfig.routeGroup}`;

  // ── Guard 1: Initial disconnected (pre-connection) ──
  // The initial useAgent state is 'disconnected' with isFinished=true, isPending=false.
  // We must NOT treat that as "session finished" — it's just the pre-connection state.
  // Show a brief connecting spinner only for this initial state before the room connects.
  if (!hasStartedConnecting && agent.state === 'disconnected') {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 animate-view-enter">
        <div className="w-16 h-16 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin-slow" />
        <div className="text-center space-y-2">
          <h2 className="text-lg font-medium text-[var(--text)]">Connecting...</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Setting up your session with {agentConfig.displayName}
          </p>
        </div>
      </div>
    );
  }

  // ── Guard 2: Connected but never interactive, now finished ──
  // The agent went through 'connecting' (or further) but never reached 'listening',
  // 'thinking', or 'speaking'. This typically means the backend agent connected and
  // immediately disconnected, or the room closed before the agent became interactive.
  // Show a "Couldn't Connect" retry screen instead of misleading "Session Complete".
  if (hasStartedConnecting && !hasBeenInteractive && agent.isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 p-8 animate-view-enter">
        <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-[var(--text)]">Couldn&apos;t Connect</h2>
          <p className="text-sm text-[var(--text-muted)] max-w-md">
            The session ended before {agentConfig.displayName} could connect.
            This can happen if the agent is busy or unavailable.
          </p>
        </div>
        <button
          onClick={() => router.push(agentStartPath)}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--primary)] text-white font-medium btn-interactive min-h-[48px]"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // ── Guard 3: Interactive session with errors ──
  // The agent was interactive (real session happened) but ended with errors.
  if (hasBeenInteractive && agent.isFinished && agent.failureReasons && agent.failureReasons.length > 0) {
    return (
      <ErrorDisplay
        failureReasons={agent.failureReasons}
        agentStartPath={agentStartPath}
      />
    );
  }

  // ── Guard 4: Interactive session completed ──
  // The agent was interactive and disconnected cleanly — a real session that ended.
  if (hasBeenInteractive && agent.isFinished) {
    return (
      <PostSessionView
        duration={timer}
        messages={messages}
        agentStartPath={agentStartPath}
        agentName={agentConfig.displayName}
      />
    );
  }

  // ── Default: Active session UI ──
  // For ALL other states — connecting, initializing, idle, listening, thinking, speaking —
  // show the full session UI. The session UI components gracefully handle the agent not
  // being fully ready yet (transcript shows "Waiting...", visualizer idles, status bar
  // shows "Connecting..." dot). This lets users see the session interface immediately
  // after the room connects, even before the agent joins.
  return (
    <>
      <StartAudioOverlay />
      {children}
    </>
  );
}

// Re-export agent state type for convenience
export type { AgentState };
