'use client';

import { useMemo } from 'react';
import type { RemoteParticipant } from 'livekit-client';

export type SentimentData = {
  primaryEmotion: string;
  confidence: number;
  escalation: number;
  trajectory: 'rising' | 'falling' | 'stable';
  vulnerabilityShift: boolean;
};

export function useSentiment(agentParticipant: RemoteParticipant | undefined): SentimentData | null {
  const raw = agentParticipant?.attributes?.sentiment_data;

  return useMemo(() => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return {
        primaryEmotion: parsed.primary_emotion ?? parsed.primaryEmotion ?? '---',
        confidence: parsed.confidence ?? 0,
        escalation: parsed.escalation ?? 0,
        trajectory: parsed.trajectory ?? 'stable',
        vulnerabilityShift: parsed.vulnerability_shift ?? parsed.vulnerabilityShift ?? false,
      };
    } catch {
      return null;
    }
  }, [raw]);
}
