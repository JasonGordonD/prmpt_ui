'use client';

import { type ComponentProps } from 'react';
import { type AgentState, type ReceivedMessage, useAgent, useSessionContext, useSessionMessages } from '@livekit/components-react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { AgentChatIndicator } from '@/components/agents-ui/agent-chat-indicator';
import { AnimatePresence } from 'motion/react';
import type { IncomingByteStream } from '@/hooks/agents-ui/use-realtime-media-data';

export interface AgentChatTranscriptProps extends ComponentProps<'div'> {
  agentState?: AgentState;
  messages?: ReceivedMessage[];
  className?: string;
  optimisticImages?: string[];
  incomingByteStreams?: IncomingByteStream[];
  agentName?: string;
}

export function AgentChatTranscript({
  agentState,
  messages: propMessages = [],
  optimisticImages,
  incomingByteStreams,
  className,
  ...props
}: AgentChatTranscriptProps) {
  const { state } = useAgent();
  const session = useSessionContext();
  const { messages: sessionMessages } = useSessionMessages(session);
  const messages = propMessages.length > 0 ? propMessages : sessionMessages;

  return (
    <Conversation className={`agent-chat-transcript h-full ${className ?? ''}`.trim()} {...props}>
      <ConversationContent className="session-transcript-scroll h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-2.5 px-4 py-3">
          {messages.map((receivedMessage) => {
            const { id, from, message, timestamp } = receivedMessage;
            const locale = navigator?.language ?? 'en-US';
            const messageOrigin = from?.isLocal ? 'user' : 'assistant';
            const time = new Date(timestamp);
            const title = time.toLocaleTimeString(locale, { timeStyle: 'medium' });

            return (
              <Message key={id} title={title} from={messageOrigin}>
                <MessageContent>
                  <MessageResponse className={messageOrigin === 'user' ? 'user-message' : 'agent-message'}>
                    {message}
                  </MessageResponse>
                </MessageContent>
              </Message>
            );
          })}

          {optimisticImages?.map((src) => (
            <div key={src} className="flex justify-end animate-fade-in">
              <img src={src} alt="Uploaded preview" className="upload-preview" />
            </div>
          ))}

          {incomingByteStreams?.map((stream) => (
            <Message key={stream.id} from="assistant">
              <MessageContent>
                <div className="agent-message">
                  {stream.mimeType.startsWith('image/') && (
                    <img src={stream.url} alt={stream.name} className="upload-preview" />
                  )}
                  {stream.mimeType.startsWith('video/') && (
                    <video src={stream.url} controls className="max-h-72 rounded-md border border-[var(--noir-border-mid)]" />
                  )}
                  {!stream.mimeType.startsWith('image/') && !stream.mimeType.startsWith('video/') && (
                    <a href={stream.url} download={stream.name} className="media-video-download-link">
                      Download {stream.name}
                    </a>
                  )}
                </div>
              </MessageContent>
            </Message>
          ))}

          <AnimatePresence>
            {(agentState ?? state) === 'thinking' && <AgentChatIndicator size="sm" />}
          </AnimatePresence>
        </div>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
