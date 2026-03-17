'use client';

import { useCallback, useState, type ComponentProps } from 'react';
import { type AgentState, type ReceivedMessage, useAgent, useSessionContext, useSessionMessages } from '@livekit/components-react';
import { Check, Copy, Download } from 'lucide-react';
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

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getMessageSpeaker(message: ReceivedMessage, agentName?: string): string {
  if (message.from?.isLocal) return 'You';
  if (message.from?.name) return message.from.name;
  return agentName ?? 'Agent';
}

export function AgentChatTranscript({
  agentState,
  messages: propMessages = [],
  optimisticImages,
  incomingByteStreams,
  agentName,
  className,
  ...props
}: AgentChatTranscriptProps) {
  const { state } = useAgent();
  const session = useSessionContext();
  const { messages: sessionMessages } = useSessionMessages(session);
  const messages = propMessages.length > 0 ? propMessages : sessionMessages;
  const [copied, setCopied] = useState(false);

  const serializeForClipboard = useCallback(() => {
    return messages
      .map((message) => {
        const speaker = getMessageSpeaker(message, agentName);
        const text = message.message ?? '';
        return `[${formatTimestamp(message.timestamp)}] ${speaker}: ${text}`;
      })
      .join('\n\n');
  }, [messages, agentName]);

  const handleCopy = useCallback(async () => {
    const text = serializeForClipboard();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }, [serializeForClipboard]);

  const handleExport = useCallback(() => {
    const text = serializeForClipboard();
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [serializeForClipboard]);

  return (
    <Conversation className={`agent-chat-transcript h-full ${className ?? ''}`.trim()} {...props}>
      <div className="transcript-actions session-transcript-toolbar flex items-center justify-end gap-2 border-b border-[var(--border)] px-4 py-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="btn-interactive flex items-center gap-1.5"
          title="Copy transcript"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="btn-interactive flex items-center gap-1.5"
          title="Export transcript"
        >
          <Download className="h-3.5 w-3.5" />
          EXPORT
        </button>
      </div>
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
