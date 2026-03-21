'use client';

import { useState, useCallback } from 'react';
import { useSessionContext } from '@livekit/components-react';
import { AGENTS } from '@/lib/agents';
import { SessionWrapper } from '@/components/shared/session-wrapper';
import { AgentLifecycleView } from '@/components/shared/agent-lifecycle-view';
import { AgentSessionView } from '@/components/agents-ui/agent-session-view-01';
import { Heart } from 'lucide-react';

const lovebirdsConfig = AGENTS.find((a) => a.id === 'lovebirds')!;

type SessionCredentials = {
  token: string;
  serverUrl: string;
};

function LovebirdsActiveSession({ onReturnToIdle }: { onReturnToIdle: () => void }) {
  const session = useSessionContext();

  return (
    <AgentSessionView
      agentConfig={lovebirdsConfig}
      isPreConnectBufferEnabled
      supportsScreenShare
      supportsChatInput
      supportsVideoInput={false}
      audioVisualizerType="aura"
      controlsVariant="outline"
      onLeave={async () => {
        try {
          await session.end();
        } catch {
          // Already disconnected
        }
        onReturnToIdle();
      }}
    />
  );
}

export default function LovebirdsPage() {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [sessionCredentials, setSessionCredentials] = useState<SessionCredentials | null>(null);

  const handleStart = useCallback(async () => {
    setConnecting(true);
    setError('');
    try {
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'lovebirds',
          agentName: 'LuvByrds',
        }),
      });
      const data = await res.json();
      if (data.token) {
        setSessionCredentials({
          token: data.token,
          serverUrl: data.livekitUrl || '',
        });
        setConnecting(false);
      } else {
        setError(data.error || 'Failed to connect. Please try again.');
        setConnecting(false);
      }
    } catch (err) {
      console.error('Failed to start Lovebirds session:', err);
      setError('Could not connect. Check your internet connection.');
      setConnecting(false);
    }
  }, []);

  if (sessionCredentials) {
    return (
      <SessionWrapper
        agentConfig={lovebirdsConfig}
        token={sessionCredentials.token}
        serverUrl={sessionCredentials.serverUrl}
        autoStart
      >
        <AgentLifecycleView agentConfig={lovebirdsConfig} autoStart>
          <LovebirdsActiveSession
            onReturnToIdle={() => {
              setSessionCredentials(null);
              setConnecting(false);
            }}
          />
        </AgentLifecycleView>
      </SessionWrapper>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[400px] space-y-6 text-center">
        <div className="space-y-3">
          <Heart className="w-8 h-8 text-[var(--noir-accent-bright)] mx-auto" />
          <h1 className="text-5xl font-display font-semibold text-[var(--noir-text)]">Lovebirds</h1>
          <p className="text-[var(--noir-text-muted)] text-xs uppercase tracking-[0.08em] font-medium">
            AI couples mediation with Raven Voss
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-600/10 border border-red-600/20 text-sm text-red-400 animate-fade-in">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={connecting}
          className="w-full py-3 rounded-lg border border-[var(--noir-accent)] bg-[rgba(7,7,10,0.78)] text-[var(--noir-accent-bright)] text-xs font-medium uppercase tracking-[0.08em] btn-interactive min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[var(--noir-accent-dim)]"
        >
          {connecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
              Connecting...
            </>
          ) : (
            'Start Session'
          )}
        </button>
      </div>
    </div>
  );
}
