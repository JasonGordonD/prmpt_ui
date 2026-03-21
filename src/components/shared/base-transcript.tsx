'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Copy, Download, Check } from 'lucide-react';
import type { ReceivedMessage } from '@livekit/components-core';
import type { AgentState } from '@livekit/components-react';
import { MarkdownWithInlineMedia } from './markdown-with-inline-media';

/* ─── Types ─── */

type MessageRendererProps = {
  message: ReceivedMessage;
  agentName?: string;
};

type BaseTranscriptProps = {
  messages: ReceivedMessage[];
  agentState?: AgentState;
  agentName?: string;
  optimisticImages?: string[];
  messageRenderer?: React.ComponentType<MessageRendererProps>;
  className?: string;
};

/* ─── Helpers ─── */

function getMessageText(msg: ReceivedMessage): string {
  if ('message' in msg && typeof msg.message === 'string') return msg.message;
  return '';
}

function getMessageSpeaker(msg: ReceivedMessage, agentName?: string): string {
  if (msg.type === 'agentTranscript') return agentName || 'Agent';
  if (msg.type === 'userTranscript') return 'You';
  // chatMessage
  if (msg.from?.name) return msg.from.name;
  return 'Chat';
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

function serializeForClipboard(messages: ReceivedMessage[], agentName?: string): string {
  return messages
    .map((m) => {
      const time = formatTimestamp(m.timestamp);
      const speaker = getMessageSpeaker(m, agentName);
      const text = getMessageText(m);
      return `[${time}] ${speaker}: ${text}`;
    })
    .join('\n\n');
}

function serializeForMarkdown(messages: ReceivedMessage[], agentName?: string): string {
  const lines = messages.map((m) => {
    const time = formatTimestamp(m.timestamp);
    const speaker = getMessageSpeaker(m, agentName);
    const text = getMessageText(m);
    return `**[${time}] ${speaker}:** ${text}`;
  });
  return `# Session Transcript\n\n${lines.join('\n\n')}`;
}

/* ─── Default Message Renderer ─── */

function DefaultMessageRenderer({ message, agentName }: MessageRendererProps) {
  const text = getMessageText(message);
  const speaker = getMessageSpeaker(message, agentName);
  const time = formatTimestamp(message.timestamp);
  const isAgent = message.type === 'agentTranscript';

  if (!isAgent) {
    return (
      <div className="group flex justify-end">
        <div className="max-w-[75%] space-y-1">
          <div className="flex items-center justify-end gap-2">
            <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--noir-text-dim)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 tabular-nums">
              {speaker}
            </span>
            <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--noir-text-dim)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 tabular-nums">
              {time}
            </span>
          </div>
          <div className="user-message">
            {text}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex justify-start">
      <div className="max-w-[80%] space-y-1">
        <div className="flex items-center gap-2">
          <span className="agent-name-label">{speaker}</span>
          <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--noir-text-dim)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 tabular-nums">
            {time}
          </span>
        </div>
        <div className="agent-message">
          <div className="max-w-none text-[var(--noir-text)] [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:font-[500] [&_h1]:font-display [&_h1]:text-[32px] [&_h1]:leading-tight [&_h1]:font-[600] [&_h2]:font-display [&_h2]:text-[22px] [&_h2]:font-[600] [&_h3]:font-display [&_h3]:text-[16px] [&_h3]:font-[500] [&_code]:font-mono [&_code]:bg-[var(--noir-bg-elevated)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_a]:text-[var(--noir-accent-bright)]">
            <MarkdownWithInlineMedia markdown={text} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Typing Indicator ─── */

function TypingIndicator({ state }: { state?: AgentState }) {
  if (state !== 'thinking') return null;

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 animate-fade-in">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse-subtle"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-[var(--text-muted)]">Thinking...</span>
    </div>
  );
}

/* ─── Main Component ─── */

export function BaseTranscript({
  messages,
  agentState,
  agentName,
  optimisticImages = [],
  messageRenderer: MessageRenderer = DefaultMessageRenderer,
  className = '',
}: BaseTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const [copied, setCopied] = useState(false);
  const [userAtBottom, setUserAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const isAtBottom = () => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const handleScroll = () => {
    const atBottom = isAtBottom();
    setUserAtBottom(atBottom);
    if (atBottom) {
      setNewMessageCount(0);
    }
  };

  // Smart auto-scroll behavior:
  // - If user is near bottom, follow new messages
  // - If user is reading history, preserve position and show a new-message pill
  useEffect(() => {
    const previousCount = previousMessageCountRef.current;
    const nextCount = messages.length;
    const addedCount = Math.max(0, nextCount - previousCount);
    previousMessageCountRef.current = nextCount;

    if (addedCount === 0) {
      return;
    }

    if (isAtBottom()) {
      scrollToBottom('smooth');
      setNewMessageCount(0);
      setUserAtBottom(true);
    } else {
      setNewMessageCount((count) => count + addedCount);
      setUserAtBottom(false);
    }
  }, [messages]);

  const handleCopy = useCallback(async () => {
    const text = serializeForClipboard(messages, agentName);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [messages, agentName]);

  const handleExport = useCallback(() => {
    const md = serializeForMarkdown(messages, agentName);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages, agentName]);

  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      {/* Toolbar */}
      <div className="transcript-actions session-transcript-toolbar flex items-center justify-end gap-2 px-4 py-2 border-b border-[var(--border)] shrink-0">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 btn-interactive"
          title="Copy transcript"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 btn-interactive"
          title="Export transcript"
        >
          <Download className="w-3.5 h-3.5" />
          EXPORT
        </button>
      </div>

      {/* Messages */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="session-transcript-scroll h-full overflow-y-auto min-h-0"
        >
          <div className="mx-auto w-full max-w-5xl space-y-3 px-5 py-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full py-16">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--noir-text-dim)] animate-pulse-subtle">
                  Waiting for conversation to begin...
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className="animate-fade-in">
                <MessageRenderer message={msg} agentName={agentName} />
              </div>
            ))}
            {optimisticImages.map((src) => (
              <div key={src} className="flex justify-end animate-fade-in">
                <img src={src} alt="Uploaded preview" className="upload-preview" />
              </div>
            ))}
            <TypingIndicator state={agentState} />
          </div>
        </div>

        <button
          type="button"
          className={`new-message-pill ${newMessageCount > 0 && !userAtBottom ? 'visible' : ''}`}
          onClick={() => {
            scrollToBottom('smooth');
            setUserAtBottom(true);
            setNewMessageCount(0);
          }}
        >
          ↓ {newMessageCount > 1 ? `${newMessageCount} new messages` : 'new message'}
        </button>
      </div>
    </div>
  );
}

// Re-export types for consumers
export type { MessageRendererProps };
