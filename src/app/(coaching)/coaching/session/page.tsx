'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionContext } from '@livekit/components-react';
import { AGENTS } from '@/lib/agents';
import { SessionWrapper } from '@/components/shared/session-wrapper';
import { AgentLifecycleView } from '@/components/shared/agent-lifecycle-view';
import { AgentSessionView } from '@/components/agents-ui/agent-session-view-01';

const coachingConfig = AGENTS.find((a) => a.id === 'coaching')!;

function CoachingSessionUI() {
  const router = useRouter();
  const session = useSessionContext();

  return (
    <AgentSessionView
      agentConfig={coachingConfig}
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
        router.push('/coaching');
      }}
    />
  );
}

export default function CoachingSessionPage() {
  return (
    <Suspense>
      <SessionWrapper agentConfig={coachingConfig}>
        <AgentLifecycleView agentConfig={coachingConfig}>
          <CoachingSessionUI />
        </AgentLifecycleView>
      </SessionWrapper>
    </Suspense>
  );
}
