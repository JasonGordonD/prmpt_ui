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

const packConfig = AGENTS.find((a) => a.id === 'pack')!;

function PackSessionUI() {
  const router = useRouter();
  const agent = useAgent();
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);

  const currentNode = agent.attributes?.current_node;
  const nodeMapping = currentNode ? packConfig.nodeMap[currentNode] : null;
  const visualizerColor = nodeMapping?.auraColor ?? packConfig.theme.auraColor;

  const handleLeave = useCallback(async () => {
    try {
      await session.end();
    } catch {
      // Already disconnected
    }
    router.push('/pack');
  }, [session, router]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <StatusBar agentConfig={packConfig} />

      <VisualizerWrapper
        audioTrack={agent.microphoneTrack}
        state={agent.state}
        color={visualizerColor}
        colorShift={packConfig.theme.auraColorShift}
        agentId="pack"
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <BaseTranscript
          messages={messages}
          agentState={agent.state}
          agentName={packConfig.displayName}
        />
      </div>

      <ControlBar onLeave={handleLeave} />
    </div>
  );
}

export default function PackSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin-slow" />
        </div>
      }
    >
      <SessionWrapper agentConfig={packConfig}>
        <AgentLifecycleView agentConfig={packConfig}>
          <PackSessionUI />
        </AgentLifecycleView>
      </SessionWrapper>
    </Suspense>
  );
}
