'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Copy, Check, ArrowRight } from 'lucide-react';
import type { ReceivedMessage } from '@livekit/components-core';

type PostSessionViewProps = {
  duration: string;
  messages: ReceivedMessage[];
  agentStartPath: string;
  agentName?: string;
  className?: string;
};

function formatTranscriptText(messages: ReceivedMessage[]): string {
  return messages
    .map((m) => {
      const time = new Date(m.timestamp).toLocaleTimeString('en-US', { hour12: false });
      const speaker = m.type === 'agentTranscript' ? 'Agent' : m.type === 'userTranscript' ? 'You' : 'Chat';
      const text = 'message' in m ? (m as { message: string }).message : '';
      return `[${time}] ${speaker}: ${text}`;
    })
    .join('\n\n');
}

function formatTranscriptMarkdown(messages: ReceivedMessage[], agentName?: string): string {
  const lines = messages.map((m) => {
    const time = new Date(m.timestamp).toLocaleTimeString('en-US', { hour12: false });
    const speaker = m.type === 'agentTranscript' ? (agentName || 'Agent') : m.type === 'userTranscript' ? 'You' : 'Chat';
    const text = 'message' in m ? (m as { message: string }).message : '';
    return `**[${time}] ${speaker}:** ${text}`;
  });
  return `# Session Transcript\n\n${lines.join('\n\n')}`;
}

export function PostSessionView({
  duration,
  messages,
  agentStartPath,
  agentName,
  className = '',
}: PostSessionViewProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = formatTranscriptText(messages);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [messages]);

  const handleExport = useCallback(() => {
    const md = formatTranscriptMarkdown(messages, agentName);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages, agentName]);

  return (
    <div className={`flex flex-col items-center justify-center h-full gap-6 p-8 animate-view-enter ${className}`}>
      <div className="w-16 h-16 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
        <Check className="w-8 h-8 text-[var(--primary)]" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-[var(--text)]">Session Complete</h2>
        <p className="text-sm text-[var(--text-muted)]">Duration: {duration}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {messages.length > 0 && (
          <>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[var(--border)] text-[var(--text)] text-sm btn-interactive min-h-[48px]"
            >
              <Download className="w-4 h-4" />
              Download Transcript
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[var(--border)] text-[var(--text)] text-sm btn-interactive min-h-[48px]"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Transcript'}
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => router.push(agentStartPath)}
        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--primary)] text-white font-medium btn-interactive min-h-[48px]"
      >
        Start New Session
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
