'use client';
/* eslint-disable @next/next/no-img-element */

import { type ComponentProps, useMemo } from 'react';
import { type AgentState, type ReceivedMessage } from '@livekit/components-react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { AgentChatIndicator } from '@/components/agents-ui/agent-chat-indicator';
import { MediaMessage, type MediaItem } from '@/components/agents-ui/agent-media-message';
import { AnimatePresence } from 'motion/react';

type TimelineEntry =
  | { kind: 'text'; msg: ReceivedMessage }
  | { kind: 'media'; item: MediaItem };

/**
 * Props for the AgentChatTranscript component.
 */
export interface AgentChatTranscriptProps extends ComponentProps<'div'> {
  agentState?: AgentState;
  messages?: ReceivedMessage[];
  mediaItems?: MediaItem[];
  className?: string;
}

/**
 * A chat transcript component that displays a conversation between the user and agent,
 * with inline image and video media items interspersed chronologically.
 */
export function AgentChatTranscript({
  agentState,
  messages = [],
  mediaItems = [],
  className,
  ...props
}: AgentChatTranscriptProps) {
  const timeline = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [];

    for (const msg of messages) {
      entries.push({ kind: 'text', msg });
    }
    for (const item of mediaItems) {
      entries.push({ kind: 'media', item });
    }

    entries.sort((a, b) => {
      const tA = a.kind === 'text' ? a.msg.timestamp : a.item.receivedAt;
      const tB = b.kind === 'text' ? b.msg.timestamp : b.item.receivedAt;
      return tA - tB;
    });

    return entries;
  }, [messages, mediaItems]);

  return (
    <Conversation className={className} {...props}>
      <ConversationContent>
        {timeline.map((entry) => {
          if (entry.kind === 'media') {
            return <MediaMessage key={`media-${entry.item.id}`} item={entry.item} />;
          }

          const { id, timestamp, from, message } = entry.msg;
          const locale =
            typeof navigator !== 'undefined' ? navigator.language : 'en-US';
          const messageOrigin = from?.isLocal ? 'user' : 'assistant';
          const time = new Date(timestamp);
          const title = time.toLocaleTimeString(locale, { timeStyle: 'full' });

          return (
            <Message key={id} title={title} from={messageOrigin}>
              <MessageContent>
                <span>{message}</span>
              </MessageContent>
            </Message>
          );
        })}
        <AnimatePresence>
          {agentState === 'thinking' && <AgentChatIndicator size="sm" />}
        </AnimatePresence>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
