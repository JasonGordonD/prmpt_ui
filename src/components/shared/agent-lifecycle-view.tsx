'use client';

import { useAgent, useSessionMessages, useSessionContext } from '@livekit/components-react';
import type { AgentConfig } from '@/lib/agents';
import type { AgentState } from '@livekit/components-react';
import { ErrorDisplay } from './error-display';
import { PostSessionView } from './post-session-view';
import { useSessionTimer } from '@/hooks/use-session-timer';
import { useHasEverConnected } from '@/hooks/use-has-ever-connected';

type AgentLifecycleViewProps = {
  agentConfig: AgentConfig;
  children: React.ReactNode;
};

export function AgentLifecycleView({ agentConfig, children }: AgentLifecycleViewProps) {
  const agent = useAgent();
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const timer = useSessionTimer(agent.isConnected, agent.isFinished);
  const hasEverConnected = useHasEverConnected(agent.state);
  const agentStartPath = `/${agentConfig.routeGroup}`;

  // If we haven't ever moved past disconnected, show connecting state.
  // The initial useAgent state is 'disconnected' with isFinished=true, isPending=false.
  // We must NOT treat that as a real "session finished" — it's just the pre-connection state.
  if (!hasEverConnected && agent.state === 'disconnected') {
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

  // Failed state with errors (only after we've actually been through a non-disconnected state)
  if (hasEverConnected && agent.isFinished && agent.failureReasons && agent.failureReasons.length > 0) {
    return (
      <ErrorDisplay
        failureReasons={agent.failureReasons}
        agentStartPath={agentStartPath}
      />
    );
  }

  // Finished successfully — post-session view (only after a real session)
  if (hasEverConnected && agent.isFinished) {
    return (
      <PostSessionView
        duration={timer}
        messages={messages}
        agentStartPath={agentStartPath}
        agentName={agentConfig.displayName}
      />
    );
  }

  // Pending — connecting/initializing
  if (agent.isPending) {
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

  // Active session — canListen or any non-pending, non-finished state
  return <>{children}</>;
}

// Re-export agent state type for convenience
export type { AgentState };
