'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CoupleHistory } from '@/components/lovebirds/couple-history';

function HistoryContent() {
  const searchParams = useSearchParams();
  const coupleId = searchParams.get('coupleId') || '';

  if (!coupleId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-semibold text-[var(--text)]">No couple selected</h2>
          <p className="text-sm text-[var(--text-muted)]">Start a session to view your history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl font-bold text-[var(--text)]">Session History</h1>
          <p className="text-sm text-[var(--text-muted)]">Your journey together</p>
        </div>
        <CoupleHistory coupleId={coupleId} />
      </div>
    </div>
  );
}

export default function LovebirdsHistoryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" /></div>}>
      <HistoryContent />
    </Suspense>
  );
}
