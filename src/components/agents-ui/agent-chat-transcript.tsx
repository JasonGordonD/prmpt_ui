'use client';

import type { ReceivedMessage } from '@livekit/components-core';
import type { AgentState } from '@livekit/components-react';
import { BaseTranscript } from '@/components/shared/base-transcript';

type AgentChatTranscriptProps = {
  messages: ReceivedMessage[];
  agentState?: AgentState;
  agentName?: string;
  optimisticImages?: string[];
  className?: string;
};

export function AgentChatTranscript({
  messages,
  agentState,
  agentName,
  optimisticImages,
  className,
}: AgentChatTranscriptProps) {
  return (
    <BaseTranscript
      messages={messages}
      agentState={agentState}
      agentName={agentName}
      optimisticImages={optimisticImages}
      className={`agent-chat-transcript ${className ?? ''}`.trim()}
    />
  );
}
