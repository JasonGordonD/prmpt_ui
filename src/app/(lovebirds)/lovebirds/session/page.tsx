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
        router.push('/lovebirds');
      }}
    />
  );
}

export default function LovebirdsSessionPage() {
  return (
    <Suspense>
      <SessionWrapper agentConfig={lovebirdsConfig}>
        <AgentLifecycleView>
          <LovebirdsSessionUI />
        </AgentLifecycleView>
      </SessionWrapper>
    </Suspense>
  );
}
