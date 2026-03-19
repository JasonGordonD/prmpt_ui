'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useMemo, useState, type ComponentProps } from 'react';
import { type AgentState, type ReceivedMessage } from '@livekit/components-react';
import { Check, Copy, Download, FileText } from 'lucide-react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { AgentChatIndicator } from '@/components/agents-ui/agent-chat-indicator';
import type { UploadTimelineItem } from '@/components/agents-ui/agent-control-bar';
import { MarkdownWithInlineMedia } from '@/components/shared/markdown-with-inline-media';
import { AnimatePresence } from 'motion/react';

/**
 * Props for the AgentChatTranscript component.
 */
export interface AgentChatTranscriptProps extends ComponentProps<'div'> {
  /**
   * The current state of the agent. When 'thinking', displays a loading indicator.
   */
  agentState?: AgentState;
  /**
   * Array of messages to display in the transcript.
   * @defaultValue []
   */
  messages?: ReceivedMessage[];
  /** Locally uploaded files shown in the live timeline. */
  uploadedItems?: UploadTimelineItem[];
  /**
   * Additional CSS class names to apply to the conversation container.
   */
  className?: string;
}

type TimelineEntry =
  | {
      kind: 'message';
      id: string;
      timestamp: number;
      from: 'user' | 'assistant';
      text: string;
    }
  | {
      kind: 'upload';
      id: string;
      timestamp: number;
      item: UploadTimelineItem;
    };

function formatTimestamp(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function serializeTimelinePlain(entries: TimelineEntry[]) {
  return entries
    .map((entry) => {
      if (entry.kind === 'message') {
        const speaker = entry.from === 'user' ? 'You' : 'Agent';
        return `[${formatTimestamp(entry.timestamp)}] ${speaker}: ${entry.text}`;
      }
      const uploadStatus = entry.item.status === 'failed' ? 'FAILED' : entry.item.status === 'uploading' ? 'UPLOADING' : 'SENT';
      return `[${formatTimestamp(entry.timestamp)}] ${entry.item.senderLabel ?? 'You'} uploaded ${entry.item.name} (${uploadStatus})`;
    })
    .join('\n\n');
}

function serializeTimelineMarkdown(entries: TimelineEntry[]) {
  const lines = entries.map((entry) => {
    if (entry.kind === 'message') {
      const speaker = entry.from === 'user' ? 'You' : 'Agent';
      return `**[${formatTimestamp(entry.timestamp)}] ${speaker}:** ${entry.text}`;
    }
    const uploadStatus = entry.item.status === 'failed' ? 'failed' : entry.item.status === 'uploading' ? 'uploading' : 'sent';
    return `**[${formatTimestamp(entry.timestamp)}] ${entry.item.senderLabel ?? 'You'} uploaded:** ${entry.item.name} _(${uploadStatus})_`;
  });

  return `# Live Session Timeline\n\n${lines.join('\n\n')}`;
}

/**
 * A chat transcript component that displays a conversation between the user and agent.
 * Shows messages with timestamps and origin indicators, plus a thinking indicator
 * when the agent is processing.
 *
 * @extends ComponentProps<'div'>
 *
 * @example
 * ```tsx
 * <AgentChatTranscript
 *   agentState={agentState}
 *   messages={chatMessages}
 * />
 * ```
 */
export function AgentChatTranscript({
  agentState,
  messages = [],
  uploadedItems = [],
  className,
  ...props
}: AgentChatTranscriptProps) {
  const [copied, setCopied] = useState(false);
  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    const messageEntries = messages.map((receivedMessage) => {
      const from: 'user' | 'assistant' = receivedMessage.from?.isLocal ? 'user' : 'assistant';
      return {
        kind: 'message' as const,
        id: receivedMessage.id,
        timestamp: receivedMessage.timestamp,
        from,
        text: receivedMessage.message ?? '',
      };
    });

    const uploadEntries = uploadedItems.map((item) => ({
      kind: 'upload' as const,
      id: item.id,
      timestamp: item.timestamp,
      item,
    }));

    return [...messageEntries, ...uploadEntries].sort((a, b) => a.timestamp - b.timestamp);
  }, [messages, uploadedItems]);

  const handleCopy = useCallback(async () => {
    if (timelineEntries.length === 0) return;
    try {
      await navigator.clipboard.writeText(serializeTimelinePlain(timelineEntries));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error('Unable to copy live timeline:', error);
    }
  }, [timelineEntries]);

  const handleExport = useCallback(() => {
    if (timelineEntries.length === 0) return;
    const markdown = serializeTimelineMarkdown(timelineEntries);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `live-timeline-${Date.now()}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [timelineEntries]);

  return (
    <Conversation className={className} {...props}>
      <div className="pointer-events-none absolute top-3 right-3 z-30 flex items-center gap-2">
        <button
          type="button"
          disabled={timelineEntries.length === 0}
          onClick={() => {
            void handleCopy();
          }}
          className="pointer-events-auto flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] disabled:opacity-40"
          title="Copy live transcript"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          type="button"
          disabled={timelineEntries.length === 0}
          onClick={handleExport}
          className="pointer-events-auto flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] disabled:opacity-40"
          title="Export live transcript"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>
      <ConversationContent>
        {timelineEntries.map((entry) => {
          if (entry.kind === 'upload') {
            const isImage = entry.item.mimeType.startsWith('image/') && !!entry.item.previewUrl;
            const statusLabel = entry.item.status === 'failed' ? 'Failed' : entry.item.status === 'uploading' ? 'Uploading...' : 'Uploaded';

            return (
              <Message key={entry.id} title={formatTimestamp(entry.timestamp)} from="user">
                <MessageContent className="w-full min-w-[260px] max-w-[min(520px,95vw)] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    <span>{entry.item.senderLabel ?? 'You'} uploaded</span>
                    <span>{formatTimestamp(entry.timestamp)}</span>
                  </div>

                  {isImage && (
                    <a
                      href={entry.item.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-3 block overflow-hidden rounded-lg border border-[var(--border)]"
                    >
                      <img
                        src={entry.item.previewUrl}
                        alt={entry.item.name}
                        className="max-h-72 w-full object-contain bg-black/40"
                      />
                    </a>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2 text-sm text-[var(--text)]">
                      <FileText className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                      <span className="truncate">{entry.item.name}</span>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${
                        entry.item.status === 'failed'
                          ? 'bg-red-500/15 text-red-300'
                          : entry.item.status === 'uploading'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  {entry.item.errorMessage && (
                    <p className="mt-2 text-xs text-red-300">{entry.item.errorMessage}</p>
                  )}
                </MessageContent>
              </Message>
            );
          }

          return (
            <Message key={entry.id} title={formatTimestamp(entry.timestamp)} from={entry.from}>
              <MessageContent>
                <div className="max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-[var(--noir-bg-elevated)] [&_code]:px-1.5 [&_code]:py-0.5 [&_a]:text-[var(--noir-accent-bright)]">
                  <MarkdownWithInlineMedia markdown={entry.text} />
                </div>
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
