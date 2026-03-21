'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionContext } from '@livekit/components-react';
import { AGENTS } from '@/lib/agents';
import { SessionWrapper } from '@/components/shared/session-wrapper';
import { AgentLifecycleView } from '@/components/shared/agent-lifecycle-view';
import { AgentSessionView } from '@/components/agents-ui/agent-session-view-01';

const minkaConfig = AGENTS.find((a) => a.id === 'minka')!;

function MinkaSessionUI() {
  const router = useRouter();
  const session = useSessionContext();

  return (
    <AgentSessionView
      agentConfig={minkaConfig}
      isPreConnectBufferEnabled
      supportsScreenShare
      supportsChatInput
      supportsImageUpload
      supportsVideoPlayer
      supportsVideoInput={false}
      audioVisualizerType="aura"
      controlsVariant="outline"
      onLeave={async () => {
        try {
          await session.end();
        } catch {
          // Already disconnected
        }
        router.push('/minka');
      }}
    />
  );
}

export default function MinkaSessionPage() {
  return (
    <Suspense>
      <SessionWrapper agentConfig={minkaConfig}>
        <AgentLifecycleView>
          <MinkaSessionUI />
        </AgentLifecycleView>
      </SessionWrapper>
    </Suspense>
  );
}
