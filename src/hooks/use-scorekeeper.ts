'use client';

import { useMemo } from 'react';
import type { RemoteParticipant } from 'livekit-client';

export type ScorekeeperData = {
  partnerA: { name: string; talkTime: number; turns: number };
  partnerB: { name: string; talkTime: number; turns: number };
  consecutiveSpeaker: string;
  consecutiveCount: number;
  escalation: number;
};

export function useScorekeeper(agentParticipant: RemoteParticipant | undefined): ScorekeeperData | null {
  const raw = agentParticipant?.attributes?.scorekeeper_state;

  return useMemo(() => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return {
        partnerA: {
          name: parsed.partner_a_name ?? parsed.partnerA?.name ?? 'Partner A',
          talkTime: parsed.partner_a_talk_time ?? parsed.partnerA?.talkTime ?? 0,
          turns: parsed.partner_a_turns ?? parsed.partnerA?.turns ?? 0,
        },
        partnerB: {
          name: parsed.partner_b_name ?? parsed.partnerB?.name ?? 'Partner B',
          talkTime: parsed.partner_b_talk_time ?? parsed.partnerB?.talkTime ?? 0,
          turns: parsed.partner_b_turns ?? parsed.partnerB?.turns ?? 0,
        },
        consecutiveSpeaker: parsed.consecutive_speaker ?? '',
        consecutiveCount: parsed.consecutive_count ?? 0,
        escalation: parsed.escalation ?? 0,
      };
    } catch {
      return null;
    }
  }, [raw]);
}
