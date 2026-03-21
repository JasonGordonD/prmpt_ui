'use client';

import { useRouter } from 'next/navigation';
import { Check, ArrowRight } from 'lucide-react';
import type { ReceivedMessage } from '@livekit/components-core';
import type { IncomingByteStream } from '@/hooks/agents-ui/use-realtime-media-data';
import { SessionExport } from '@/components/agents-ui/session-export';

type PostSessionViewProps = {
  duration: string;
  messages: ReceivedMessage[];
  agentStartPath: string;
  agentName?: string;
  mediaStreams?: IncomingByteStream[];
  className?: string;
};

export function PostSessionView({
  duration,
  messages,
  agentStartPath,
  agentName,
  mediaStreams = [],
  className = '',
}: PostSessionViewProps) {
  const router = useRouter();

  return (
    <div className={`flex flex-col items-center justify-center h-full gap-6 p-8 animate-view-enter ${className}`}>
      <div className="w-16 h-16 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
        <Check className="w-8 h-8 text-[var(--primary)]" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-[var(--text)]">Session Complete</h2>
        <p className="text-sm text-[var(--text-muted)]">Duration: {duration}</p>
      </div>

      <SessionExport
        messages={messages}
        mediaStreams={mediaStreams}
        agentName={agentName}
        variant="post-session"
      />

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
