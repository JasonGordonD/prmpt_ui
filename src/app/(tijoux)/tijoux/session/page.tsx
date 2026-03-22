'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionContext } from '@livekit/components-react';
import { AGENTS } from '@/lib/agents';
import { SessionWrapper } from '@/components/shared/session-wrapper';
import { AgentLifecycleView } from '@/components/shared/agent-lifecycle-view';
import { AgentSessionView } from '@/components/agents-ui/agent-session-view-01';

const tijouxConfig = AGENTS.find((a) => a.id === 'tijoux')!;

function TijouxSessionUI() {
  const router = useRouter();
  const session = useSessionContext();

  return (
    <AgentSessionView
      agentConfig={tijouxConfig}
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
        router.push('/tijoux');
      }}
    />
  );
}

export default function TijouxSessionPage() {
  return (
    <Suspense>
      <SessionWrapper agentConfig={tijouxConfig}>
        <AgentLifecycleView agentConfig={tijouxConfig}>
          <TijouxSessionUI />
        </AgentLifecycleView>
      </SessionWrapper>
    </Suspense>
  );
}
