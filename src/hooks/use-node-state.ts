'use client';

import { useMemo } from 'react';
import type { RemoteParticipant } from 'livekit-client';
import type { AgentConfig } from '@/lib/agents';

export type NodeStateData = {
  rawNode: string;
  label: string;
  color: string;
  auraColor: string | undefined;
};

export function useNodeState(
  agentParticipant: RemoteParticipant | undefined,
  nodeMap: AgentConfig['nodeMap']
): NodeStateData | null {
  const raw = agentParticipant?.attributes?.current_node;

  return useMemo(() => {
    if (!raw) return null;
    const mapped = nodeMap[raw];
    if (mapped) {
      return {
        rawNode: raw,
        label: mapped.label,
        color: mapped.color,
        auraColor: mapped.auraColor,
      };
    }
    return {
      rawNode: raw,
      label: raw,
      color: '#888',
      auraColor: undefined,
    };
  }, [raw, nodeMap]);
}
