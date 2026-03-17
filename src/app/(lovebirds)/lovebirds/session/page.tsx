'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionContext } from '@livekit/components-react';
import { AGENTS } from '@/lib/agents';
import { SessionWrapper } from '@/components/shared/session-wrapper';
import { AgentLifecycleView } from '@/components/shared/agent-lifecycle-view';
import { AgentSessionView } from '@/components/agents-ui/agent-session-view-01';

const lovebirdsConfig = AGENTS.find((a) => a.id === 'lovebirds')!;

function LovebirdsSessionUI() {
  const router = useRouter();
  const session = useSessionContext();

  return (
    <AgentSessionView
      agentConfig={lovebirdsConfig}
      isPreConnectBufferEnabled
      supportsScreenShare
      supportsChatInput
      supportsVideoInput={false}
      audioVisualizerType="bar"
      controlsVariant="outline"
      onLeave={async () => {
        try {
          await session.end();
        } catch {
          // Already disconnected
        }
        router.push('/lovebirds');
      }}
    />
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
