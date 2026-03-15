'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RotateCcw, Copy, Check } from 'lucide-react';

type ErrorDisplayProps = {
  failureReasons: string[];
  agentStartPath: string;
  className?: string;
};

export function ErrorDisplay({
  failureReasons,
  agentStartPath,
  className = '',
}: ErrorDisplayProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopyError = useCallback(async () => {
    const errorText = failureReasons.join('\n');
    await navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [failureReasons]);

  const handleRetry = useCallback(() => {
    router.push(agentStartPath);
  }, [router, agentStartPath]);

  return (
    <div className={`flex flex-col items-center justify-center h-full gap-6 p-8 animate-view-enter ${className}`}>
      <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-[var(--text)]">Session Error</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Something went wrong during the session.
        </p>
      </div>

      {failureReasons.length > 0 && (
        <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Error Details
          </h3>
          <ul className="space-y-1.5">
            {failureReasons.map((reason, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-red-400"
              >
                <span className="mt-0.5 shrink-0">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--primary)] text-white font-medium btn-interactive min-h-[48px]"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </button>
        <button
          onClick={handleCopyError}
          className="flex items-center gap-2 px-4 py-3 rounded-lg border border-[var(--border)] text-[var(--text)] text-sm btn-interactive min-h-[48px]"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy Error'}
        </button>
      </div>
    </div>
  );
}
