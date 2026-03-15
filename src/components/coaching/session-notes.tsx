'use client';

import { useState } from 'react';

type SessionNotesProps = {
  className?: string;
  onNotesChange?: (notes: string) => void;
};

export function SessionNotes({ className = '', onNotesChange }: SessionNotesProps) {
  const [notes, setNotes] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    onNotesChange?.(e.target.value);
  };

  return (
    <div className={className}>
      <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
        Session Notes
      </label>
      <textarea
        value={notes}
        onChange={handleChange}
        placeholder="Take notes during your session..."
        className="w-full h-40 px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none resize-none focus:border-[var(--primary)] transition-colors"
      />
    </div>
  );
}
