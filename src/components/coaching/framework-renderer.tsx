'use client';

import type { TranscriptMessage } from '@/components/shared/base-transcript';

type Framework = {
  name: string;
  step: string;
  color: string;
};

const FRAMEWORK_KEYWORDS: Record<string, { framework: string; color: string }> = {
  goal: { framework: 'GROW', color: '#2e8b8b' },
  reality: { framework: 'GROW', color: '#2e8b8b' },
  options: { framework: 'GROW', color: '#2e8b8b' },
  will: { framework: 'GROW', color: '#2e8b8b' },
  'way forward': { framework: 'GROW', color: '#2e8b8b' },
  outcome: { framework: 'OSKAR', color: '#4a9eca' },
  scaling: { framework: 'OSKAR', color: '#4a9eca' },
  'know-how': { framework: 'OSKAR', color: '#4a9eca' },
  affirm: { framework: 'OSKAR', color: '#4a9eca' },
  review: { framework: 'OSKAR', color: '#4a9eca' },
  subject: { framework: 'STEPPA', color: '#7b3fa0' },
  target: { framework: 'STEPPA', color: '#7b3fa0' },
  emotion: { framework: 'STEPPA', color: '#7b3fa0' },
  perception: { framework: 'STEPPA', color: '#7b3fa0' },
  plan: { framework: 'STEPPA', color: '#7b3fa0' },
  pace: { framework: 'STEPPA', color: '#7b3fa0' },
  act: { framework: 'STEPPA', color: '#7b3fa0' },
};

function detectFrameworks(text: string): Framework[] {
  const found: Framework[] = [];
  const lower = text.toLowerCase();
  const seen = new Set<string>();

  for (const [keyword, { framework, color }] of Object.entries(FRAMEWORK_KEYWORDS)) {
    const key = `${framework}:${keyword}`;
    if (!seen.has(key) && lower.includes(keyword)) {
      seen.add(key);
      found.push({ name: framework, step: keyword.charAt(0).toUpperCase() + keyword.slice(1), color });
    }
  }

  return found;
}

type FrameworkMessageRendererProps = {
  message: TranscriptMessage;
};

export function FrameworkMessageRenderer({ message }: FrameworkMessageRendererProps) {
  const frameworks = message.role === 'agent' ? detectFrameworks(message.content) : [];

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          message.role === 'user'
            ? 'bg-[var(--primary)] text-white'
            : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]'
        }`}
      >
        {frameworks.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {frameworks.map((fw, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 text-[10px] rounded font-medium text-white"
                style={{ backgroundColor: fw.color }}
              >
                {fw.name}: {fw.step}
              </span>
            ))}
          </div>
        )}
        {message.content}
      </div>
    </div>
  );
}
