'use client';

import { useEffect, useRef } from 'react';

export type TranscriptMessage = {
  id: string;
  role: 'agent' | 'user';
  content: string;
  timestamp?: number;
};

type AgentChatTranscriptProps = {
  messages: TranscriptMessage[];
  className?: string;
};

export function AgentChatTranscript({ messages, className = '' }: AgentChatTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollRef} className={`overflow-y-auto space-y-3 ${className}`}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface)] text-[var(--text)]'
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
    </div>
  );
}
