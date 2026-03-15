'use client';

import { useState } from 'react';
import { Phone } from 'lucide-react';

type MinkaWelcomeProps = {
  onStart: (callerName: string) => void;
};

export function MinkaWelcome({ onStart }: MinkaWelcomeProps) {
  const [callerName, setCallerName] = useState('');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-[var(--text)]">Minka Moor</h1>
        <p className="text-[var(--text-muted)] text-sm">Voice experience</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5">Your name (optional)</label>
          <input
            type="text"
            value={callerName}
            onChange={(e) => setCallerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-colors"
          />
        </div>

        <button
          onClick={() => onStart(callerName)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity"
        >
          <Phone className="w-4 h-4" />
          Call Minka
        </button>
      </div>
    </div>
  );
}
