'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AgentChatIndicator } from '@/components/agents-ui/agent-chat-indicator';
import { Copy, Download } from 'lucide-react';

export type TranscriptMessage = {
  id: string;
  role: 'agent' | 'user';
  content: string;
  timestamp?: number;
  imageData?: string;
};

type MessageRendererProps = {
  message: TranscriptMessage;
};

type BaseTranscriptProps = {
  messages: TranscriptMessage[];
  isAgentTyping?: boolean;
  messageRenderer?: React.ComponentType<MessageRendererProps>;
  className?: string;
  showControls?: boolean;
};

function DefaultMessageRenderer({ message }: MessageRendererProps) {
  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          message.role === 'user'
            ? 'bg-[var(--primary)] text-white'
            : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]'
        }`}
      >
        {message.content}
        {message.imageData && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.imageData}
              alt="Shared image"
              className="max-w-[300px] rounded cursor-pointer"
              onClick={(e) => {
                const img = e.currentTarget;
                if (img.style.maxWidth === 'none') {
                  img.style.maxWidth = '300px';
                } else {
                  img.style.maxWidth = 'none';
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function serializeMessages(messages: TranscriptMessage[]): string {
  return messages
    .map((m) => `[${m.role === 'agent' ? 'Agent' : 'You'}] ${m.content}`)
    .join('\n\n');
}

export function BaseTranscript({
  messages,
  isAgentTyping = false,
  messageRenderer: MessageRenderer = DefaultMessageRenderer,
  className = '',
  showControls = true,
}: BaseTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCopy = useCallback(async () => {
    const text = serializeMessages(messages);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [messages]);

  const handleExport = useCallback(() => {
    const text = `# Session Transcript\n\n${serializeMessages(messages)}`;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {showControls && (
        <div className="flex items-center justify-end gap-2 px-3 py-2 border-b border-[var(--border)]">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] rounded transition-colors"
            title="Copy transcript"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] rounded transition-colors"
            title="Export transcript"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.map((msg) => (
          <div key={msg.id} className="animate-fade-in">
            <MessageRenderer message={msg} />
          </div>
        ))}
        <AgentChatIndicator isActive={isAgentTyping} />
      </div>
    </div>
  );
}
