'use client';

import { useState } from 'react';
import type { AgentState } from '@livekit/components-react';

/**
 * Tracks two milestones in the agent connection lifecycle:
 *
 * 1. `hasStartedConnecting` — true once the agent moves past the initial
 *    'disconnected' state (e.g. into 'connecting', 'pre-connect-buffering', etc.).
 *    Used to gate the initial "Connecting…" spinner.
 *
 * 2. `hasBeenInteractive` — true once the agent has reached a truly interactive
 *    state ('listening', 'thinking', or 'speaking'). Used to gate the
 *    "Session Complete" post-session view. If the agent connects and immediately
 *    disconnects without ever being interactive, we show a "Couldn't Connect"
 *    retry screen instead of the misleading "Session Complete".
 */
export function useHasEverConnected(agentState: AgentState): {
  hasStartedConnecting: boolean;
  hasBeenInteractive: boolean;
} {
  const [hasStarted, setHasStarted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // When agent transitions away from 'disconnected', we know connection has begun.
  if (!hasStarted && agentState !== 'disconnected') {
    setHasStarted(true);
  }

  // When agent reaches an interactive state, we know a real session occurred.
  if (
    !hasInteracted &&
    (agentState === 'listening' ||
      agentState === 'thinking' ||
      agentState === 'speaking')
  ) {
    setHasInteracted(true);
  }

  return { hasStartedConnecting: hasStarted, hasBeenInteractive: hasInteracted };
}
