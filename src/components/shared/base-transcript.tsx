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
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--noir-text-dim)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 tabular-nums">
              {speaker}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--noir-text-dim)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 tabular-nums">
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
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--noir-text-dim)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 tabular-nums">
            {time}
          </span>
        </div>
        <div className="agent-message">
          <div className="max-w-none text-[var(--noir-text)] [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:font-[700] [&_h1]:font-display [&_h1]:text-[1.7rem] [&_h1]:leading-tight [&_h1]:font-[600] [&_h2]:font-display [&_h2]:text-[1.35rem] [&_h2]:font-[600] [&_h3]:font-display [&_h3]:text-[1.15rem] [&_h3]:font-[600] [&_code]:font-mono [&_code]:bg-[var(--noir-bg-elevated)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_a]:text-[var(--noir-accent-bright)]">
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
  messageRenderer: MessageRenderer = DefaultMessageRenderer,
  className = '',
}: BaseTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCopy = useCallback(async () => {
    const text = serializeForClipboard(messages, agentName);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-[var(--border)] shrink-0">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg btn-interactive"
          title="Copy transcript"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg btn-interactive"
          title="Export transcript"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[var(--text-muted)] animate-pulse-subtle">
              Waiting for conversation to begin...
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="animate-fade-in">
            <MessageRenderer message={msg} agentName={agentName} />
          </div>
        ))}
        <TypingIndicator state={agentState} />
      </div>
    </div>
  );
}

// Re-export types for consumers
export type { MessageRendererProps };
