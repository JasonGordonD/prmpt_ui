'use client';

import { useState } from 'react';
import type { AgentState } from '@livekit/components-react';

/**
 * Tracks whether the agent has ever moved past the initial 'disconnected' state.
 *
 * Uses React state with a lazy initializer pattern. The state is updated
 * by returning a new value from the render — React will re-render once
 * the state catches up.
 */
export function useHasEverConnected(agentState: AgentState): boolean {
  const [hasConnected, setHasConnected] = useState(false);

  // When agent transitions away from 'disconnected', we know a real connection happened.
  // React batches this setState with the current render, causing one extra re-render
  // but avoiding the forbidden patterns (no refs in render, no setState in effects).
  if (!hasConnected && agentState !== 'disconnected') {
    setHasConnected(true);
  }

  return hasConnected;
}
