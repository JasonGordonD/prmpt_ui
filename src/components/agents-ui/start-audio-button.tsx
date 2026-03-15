'use client';

import { useState } from 'react';

type Props = {
  className?: string;
};

export function StartAudioButton({ className = '' }: Props) {
  const [started, setStarted] = useState(false);

  if (started) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 ${className}`}>
      <button
        onClick={() => setStarted(true)}
        className="px-6 py-3 rounded-lg bg-[var(--primary)] text-white font-medium text-lg hover:opacity-90 transition-opacity"
      >
        Start Audio
      </button>
    </div>
  );
}
