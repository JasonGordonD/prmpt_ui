'use client';

import { useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAgent, useSessionMessages, useSessionContext } from '@livekit/components-react';
import { AGENTS } from '@/lib/agents';
import { SessionWrapper } from '@/components/shared/session-wrapper';
import { AgentLifecycleView } from '@/components/shared/agent-lifecycle-view';
import { StatusBar } from '@/components/shared/status-bar';
import { BaseTranscript } from '@/components/shared/base-transcript';
import { VisualizerWrapper } from '@/components/shared/visualizer-wrapper';
import { ControlBar } from '@/components/shared/control-bar';

const minkaConfig = AGENTS.find((a) => a.id === 'minka')!;

function MinkaSessionUI() {
  const router = useRouter();
  const agent = useAgent();
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);

  // Determine visualizer color from node attributes
  const currentNode = agent.attributes?.current_node;
  const nodeMapping = currentNode ? minkaConfig.nodeMap[currentNode] : null;
  const visualizerColor = nodeMapping?.auraColor ?? minkaConfig.theme.auraColor;

  const handleLeave = useCallback(async () => {
    try {
      await session.end();
    } catch {
      // Already disconnected
    }
    router.push('/minka');
  }, [session, router]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <StatusBar agentConfig={minkaConfig} />

      <VisualizerWrapper
        audioTrack={agent.microphoneTrack}
        state={agent.state}
        color={visualizerColor}
        colorShift={minkaConfig.theme.auraColorShift}
        agentId="minka"
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <BaseTranscript
          messages={messages}
          agentState={agent.state}
          agentName={minkaConfig.displayName}
        />
      </div>

      <ControlBar onLeave={handleLeave} />
    </div>
  );
}

export default function MinkaSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin-slow" />
        </div>
      }
    >
      <SessionWrapper agentConfig={minkaConfig}>
        <AgentLifecycleView agentConfig={minkaConfig}>
          <MinkaSessionUI />
        </AgentLifecycleView>
      </SessionWrapper>
    </Suspense>
  );
}
