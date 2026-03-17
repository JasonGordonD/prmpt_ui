'use client';

import { useAgent, useSessionContext, useSessionMessages } from '@livekit/components-react';
import { BaseTranscript } from '@/components/shared/base-transcript';

type AgentChatTranscriptProps = {
  agentName?: string;
  optimisticImages?: string[];
  className?: string;
};

export function AgentChatTranscript({
  agentName,
  optimisticImages,
  className,
}: AgentChatTranscriptProps) {
  const agent = useAgent();
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);

  return (
    <BaseTranscript
      messages={messages}
      agentState={agent.state}
      agentName={agentName}
      optimisticImages={optimisticImages}
      className={`agent-chat-transcript ${className ?? ''}`.trim()}
    />
  );
}
