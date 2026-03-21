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
      supportsImageUpload
      supportsVideoInput={false}
      audioVisualizerType="aura"
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
    <Suspense>
      <SessionWrapper agentConfig={packConfig}>
        <AgentLifecycleView>
          <PackSessionUI />
        </AgentLifecycleView>
      </SessionWrapper>
    </Suspense>
  );
}
