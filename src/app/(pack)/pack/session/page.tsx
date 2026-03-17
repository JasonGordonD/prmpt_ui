'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionContext } from '@livekit/components-react';
import { AGENTS } from '@/lib/agents';
import { SessionWrapper } from '@/components/shared/session-wrapper';
import { AgentLifecycleView } from '@/components/shared/agent-lifecycle-view';
import { AgentSessionView } from '@/components/agents-ui/agent-session-view-01';

const packConfig = AGENTS.find((a) => a.id === 'pack')!;

function PackSessionUI() {
  const router = useRouter();
  const session = useSessionContext();

  return (
    <AgentSessionView
      agentConfig={packConfig}
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
        router.push('/pack');
      }}
    />
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
