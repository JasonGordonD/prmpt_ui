'use client';

import type { ReceivedMessage } from '@livekit/components-core';
import ReactMarkdown from 'react-markdown';

type DiarizedMessageRendererProps = {
  message: ReceivedMessage;
  agentName?: string;
};

type SpeakerInfo = {
  name: string;
  type: 'partnerA' | 'partnerB' | 'raven' | 'tijoux' | 'unknown';
};

function getMessageText(msg: ReceivedMessage): string {
  if ('message' in msg && typeof msg.message === 'string') return msg.message;
  return '';
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

function parseSpeaker(content: string): { speaker: SpeakerInfo; text: string } {
  const bracketMatch = content.match(/^\[([^\]]+)\]\s*([\s\S]*)/);

  if (!bracketMatch) {
    return {
      speaker: { name: 'Unknown', type: 'unknown' },
      text: content,
    };
  }

  const name = bracketMatch[1].trim();
  const text = bracketMatch[2];

  if (name.toLowerCase().includes('tijoux')) {
    return { speaker: { name, type: 'tijoux' }, text };
  }
  if (name.toLowerCase().includes('raven')) {
    return { speaker: { name, type: 'raven' }, text };
  }
  // Check for PartnerA/PartnerB patterns - these will be first names in practice
  // For now, treat any non-recognized name as a partner
  // If it's the first unknown name seen, treat as partnerA; second as partnerB
  // Simple heuristic: if name starts with letters A-M = partnerA, N-Z = partnerB
  // This is a fallback — real diarization comes from speaker tags
  return { speaker: { name, type: 'unknown' }, text };
}

const speakerStyles: Record<SpeakerInfo['type'], { badge: string; bg: string; border: string; text: string }> = {
  partnerA: {
    badge: 'bg-[#c46a3a] text-white',
    bg: 'bg-[#2a1f18]/80',
    border: 'border-[#c46a3a]/30',
    text: 'text-[#f0dcc8]',
  },
  partnerB: {
    badge: 'bg-[#1a4a42] text-white',
    bg: 'bg-[#1a2a28]/80',
    border: 'border-[#1a4a42]/30',
    text: 'text-[#c8e8e0]',
  },
  raven: {
    badge: 'bg-[#d4a050]/20 text-[#d4a050]',
    bg: 'bg-[var(--surface)]',
    border: 'border-l-2 border-l-[#d4a050] border-[var(--border)]',
    text: 'text-[var(--text)]',
  },
  tijoux: {
    badge: 'bg-[#6b5b8d]/20 text-[#6b5b8d]',
    bg: 'bg-[#3a3050]',
    border: 'border-t-2 border-t-[#6b5b8d] border-[#4a3d60]',
    text: 'text-[#d0c8e0]',
  },
  unknown: {
    badge: 'bg-[var(--surface)] text-[var(--text-muted)]',
    bg: 'bg-[var(--surface)]',
    border: 'border-[var(--border)]',
    text: 'text-[var(--text)]',
  },
};

export function DiarizedMessageRenderer({ message }: DiarizedMessageRendererProps) {
  const text = getMessageText(message);
  const time = formatTimestamp(message.timestamp);
  const isUser = message.type === 'userTranscript' || (message.type === 'chatMessage' && !text.startsWith('['));

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] space-y-1">
          <div className="flex items-center justify-end gap-2">
            <span className="text-[11px] text-[var(--text-muted)] tabular-nums">{time}</span>
            <span className="text-[11px] font-medium text-[var(--text-muted)]">You</span>
          </div>
          <div className="rounded-xl px-4 py-2.5 text-sm bg-[var(--primary)] text-white">
            {text}
          </div>
        </div>
      </div>
    );
  }

  const { speaker, text: parsedText } = parseSpeaker(text);
  const styles = speakerStyles[speaker.type];

  return (
    <div className="flex justify-start">
      <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm border ${styles.bg} ${styles.border} space-y-1`}>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-[11px] rounded-lg font-medium uppercase ${styles.badge}`}>
            {speaker.name}
          </span>
          <span className="text-[11px] text-[var(--text-muted)] tabular-nums">{time}</span>
        </div>
        <div className={`${styles.text} prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1`}>
          <ReactMarkdown>{parsedText}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export function TijouxDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 py-3 animate-fade-in ${className}`}>
      <div className="flex-1 h-px bg-[#6b5b8d]/40" />
      <span className="text-xs text-[#6b5b8d] font-medium">— Dr. Tijoux joining —</span>
      <div className="flex-1 h-px bg-[#6b5b8d]/40" />
    </div>
  );
}
