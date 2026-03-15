'use client';

import type { TranscriptMessage } from '@/components/shared/base-transcript';

type DiarizedMessageRendererProps = {
  message: TranscriptMessage;
};

type SpeakerInfo = {
  name: string;
  type: 'partnerA' | 'partnerB' | 'raven' | 'tijoux' | 'unknown';
};

function parseSpeaker(content: string, partnerAName?: string, partnerBName?: string): { speaker: SpeakerInfo; text: string } {
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
  if (partnerAName && name.toLowerCase() === partnerAName.toLowerCase()) {
    return { speaker: { name, type: 'partnerA' }, text };
  }
  if (partnerBName && name.toLowerCase() === partnerBName.toLowerCase()) {
    return { speaker: { name, type: 'partnerB' }, text };
  }

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
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-[var(--primary)] text-white">
          {message.content}
        </div>
      </div>
    );
  }

  const { speaker, text } = parseSpeaker(message.content);
  const styles = speakerStyles[speaker.type];

  return (
    <div className="flex justify-start">
      <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm border ${styles.bg} ${styles.border}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${styles.badge}`}>
            {speaker.name}
          </span>
        </div>
        <div className={styles.text}>{text}</div>
      </div>
    </div>
  );
}

type TijouxDividerProps = {
  className?: string;
};

export function TijouxDivider({ className = '' }: TijouxDividerProps) {
  return (
    <div className={`flex items-center gap-3 py-3 ${className}`}>
      <div className="flex-1 h-px bg-[#6b5b8d]/40" />
      <span className="text-xs text-[#6b5b8d] font-medium">Dr. Tijoux joining</span>
      <div className="flex-1 h-px bg-[#6b5b8d]/40" />
    </div>
  );
}
