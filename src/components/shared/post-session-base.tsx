'use client';

import { useCallback } from 'react';
import { Download, Copy, RotateCcw } from 'lucide-react';

type PostSessionBaseProps = {
  duration?: string;
  transcript?: string;
  summary?: string;
  error?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
  className?: string;
};

export function PostSessionBase({
  duration,
  transcript,
  summary,
  error,
  onRetry,
  children,
  className = '',
}: PostSessionBaseProps) {
  const handleDownloadTranscript = useCallback(() => {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transcript]);

  const handleCopySummary = useCallback(async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
  }, [summary]);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 ${className}`}>
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-600/20 flex items-center justify-center">
            <span className="text-red-400 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text)]">Session Error</h2>
          <p className="text-[var(--text-muted)] text-sm max-w-md">{error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`max-w-3xl mx-auto p-6 space-y-6 ${className}`}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-[var(--text)]">Session Complete</h2>
        {duration && (
          <p className="text-[var(--text-muted)] text-sm">Duration: {duration}</p>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        {transcript && (
          <button
            onClick={handleDownloadTranscript}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-[var(--border)] rounded-lg text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Transcript
          </button>
        )}
        {summary && (
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-[var(--border)] rounded-lg text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy Summary
          </button>
        )}
      </div>

      {children}
    </div>
  );
}
