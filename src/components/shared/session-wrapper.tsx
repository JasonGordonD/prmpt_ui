'use client';

import { useMemo, useEffect, useCallback, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TokenSource } from 'livekit-client';
import {
  useSession,
  SessionProvider,
  useAudioPlayback,
  useSessionContext,
} from '@livekit/components-react';
import type { AgentConfig } from '@/lib/agents';

/* ─── Start Audio Overlay ─── */
function StartAudioOverlay() {
  const { canPlayAudio, startAudio } = useAudioPlayback();

  if (canPlayAudio) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
      <div className="flex flex-col items-center gap-6 p-8">
        <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center animate-pulse-subtle">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 12h.01" />
          </svg>
        </div>
        <button
          onClick={startAudio}
          className="px-8 py-4 rounded-lg bg-[var(--primary)] text-white font-medium text-lg btn-interactive min-h-[48px]"
        >
          Start Audio
        </button>
        <p className="text-sm text-[var(--text-muted)]">
          Click to enable audio playback
        </p>
      </div>
    </div>
  );
}

/* ─── Inner session content (must be inside SessionProvider) ─── */
function SessionContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StartAudioOverlay />
      {children}
    </>
  );
}

/* ─── Session Connector ─── */
function SessionConnector({
  token,
  serverUrl,
  children,
}: {
  token: string;
  serverUrl: string;
  children: React.ReactNode;
}) {
  const tokenSource = useMemo(
    () => TokenSource.literal({ serverUrl, participantToken: token }),
    [serverUrl, token]
  );

  const session = useSession(tokenSource);

  useEffect(() => {
    if (session.connectionState === 'disconnected') {
      session.start({
        tracks: { microphone: { enabled: true } },
      });
    }
    // Only start once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SessionProvider session={session}>
      <SessionContent>{children}</SessionContent>
    </SessionProvider>
  );
}

/* ─── Main SessionWrapper (reads URL params, renders connector) ─── */
function SessionWrapperInner({
  children,
}: {
  agentConfig: AgentConfig;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const serverUrl = searchParams.get('url') || '';

  if (!token || !serverUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 animate-view-enter">
        <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center">
          <span className="text-red-400 text-2xl">!</span>
        </div>
        <h2 className="text-xl font-semibold text-[var(--text)]">Session Error</h2>
        <p className="text-sm text-[var(--text-muted)] text-center max-w-md">
          Missing session credentials. Please start a new session.
        </p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 rounded-lg bg-[var(--primary)] text-white font-medium btn-interactive min-h-[48px]"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <SessionConnector token={token} serverUrl={serverUrl}>
      {children}
    </SessionConnector>
  );
}

export function SessionWrapper({
  agentConfig,
  children,
}: {
  agentConfig: AgentConfig;
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin-slow" />
        </div>
      }
    >
      <SessionWrapperInner agentConfig={agentConfig}>{children}</SessionWrapperInner>
    </Suspense>
  );
}

/* ─── Hook to access session from child components ─── */
export function useSessionSafe() {
  try {
    return useSessionContext();
  } catch {
    return null;
  }
}
