'use client';

import { useCallback, useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAgent, useSessionMessages, useSessionContext } from '@livekit/components-react';
import { AGENTS } from '@/lib/agents';
import { SessionWrapper } from '@/components/shared/session-wrapper';
import { AgentLifecycleView } from '@/components/shared/agent-lifecycle-view';
import { StatusBar } from '@/components/shared/status-bar';
import { BaseTranscript } from '@/components/shared/base-transcript';
import { VisualizerWrapper } from '@/components/shared/visualizer-wrapper';
import { ControlBar } from '@/components/shared/control-bar';
import { Scorekeeper, ScorekeeperCompact } from '@/components/lovebirds/scorekeeper';
import { DiarizedMessageRenderer } from '@/components/lovebirds/diarized-transcript';
import { HandoffTransition } from '@/components/lovebirds/handoff-transition';
import type { ScorekeeperData } from '@/hooks/use-scorekeeper';

const lovebirdsConfig = AGENTS.find((a) => a.id === 'lovebirds')!;

function parseScorekeeperData(raw: string | undefined): ScorekeeperData | null {
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
}

function LovebirdsSessionUI() {
  const router = useRouter();
  const agent = useAgent();
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const [isTijoux, setIsTijoux] = useState(false);

  // Read attributes
  const currentNode = agent.attributes?.current_node;
  const scorekeeperRaw = agent.attributes?.scorekeeper_state;

  // Parse scorekeeper data
  const scorekeeperData = useMemo(() => parseScorekeeperData(scorekeeperRaw), [scorekeeperRaw]);

  // Determine visualizer color
  const nodeMapping = currentNode ? lovebirdsConfig.nodeMap[currentNode] : null;
  const visualizerColor = isTijoux
    ? '#6b5b8d'
    : nodeMapping?.auraColor ?? lovebirdsConfig.theme.auraColor;

  const handleTransition = useCallback((isTijouxNow: boolean) => {
    setIsTijoux(isTijouxNow);
  }, []);

  const handleLeave = useCallback(async () => {
    try {
      await session.end();
    } catch {
      // Already disconnected
    }
    router.push('/lovebirds');
  }, [session, router]);

  return (
    <HandoffTransition currentNode={currentNode} onTransition={handleTransition}>
      <div className="flex flex-col h-screen overflow-hidden">
        <StatusBar agentConfig={lovebirdsConfig} />

        {/* Compact scorekeeper for mobile */}
        <div className="lg:hidden">
          <ScorekeeperCompact data={scorekeeperData} isPaused={isTijoux} />
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Desktop scorekeeper sidebar */}
          <div className="w-[250px] border-r border-[var(--border)] overflow-y-auto hidden lg:block shrink-0">
            <Scorekeeper data={scorekeeperData} isPaused={isTijoux} />
          </div>

          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <VisualizerWrapper
              audioTrack={agent.microphoneTrack}
              state={agent.state}
              color={visualizerColor}
              colorShift={lovebirdsConfig.theme.auraColorShift}
              agentId="lovebirds"
              compact
            />

            <div className="flex-1 min-h-0 overflow-hidden">
              <BaseTranscript
                messages={messages}
                agentState={agent.state}
                agentName="Raven"
                messageRenderer={DiarizedMessageRenderer}
              />
            </div>
          </div>
        </div>

        <ControlBar onLeave={handleLeave} />
      </div>
    </HandoffTransition>
  );
}

export default function LovebirdsSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin-slow" />
        </div>
      }
    >
      <SessionWrapper agentConfig={lovebirdsConfig}>
        <AgentLifecycleView agentConfig={lovebirdsConfig}>
          <LovebirdsSessionUI />
        </AgentLifecycleView>
      </SessionWrapper>
    </Suspense>
  );
}
