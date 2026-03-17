'use client';

import { useState } from 'react';
import { useAgent, useSessionMessages, useSessionContext } from '@livekit/components-react';
import type { AgentConfig } from '@/lib/agents';
import type { AgentState } from '@livekit/components-react';
import { ErrorDisplay } from './error-display';
import { PostSessionView } from './post-session-view';
import { StartAudioOverlay } from './session-wrapper';
import { useSessionTimer } from '@/hooks/use-session-timer';
import { useHasEverConnected } from '@/hooks/use-has-ever-connected';
import { ReactShaderToy } from '@/components/agents-ui/react-shader-toy';

const PRECONNECT_SHADER = `
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

  float amplitude = max(iAudioAmplitude, 0.04);
  float t = iTime * 0.22;
  vec2 p = uv * 1.35;

  float warp = sin((p.y + t) * 2.2) * 0.12 + cos((p.x - t * 0.8) * 2.6) * 0.08;
  p += vec2(warp, -warp * 0.55);

  float n = 0.0;
  for(int i = 1; i <= 6; i++) {
    float fi = float(i);
    n += sin(p.x * fi * 2.6 + t + amplitude * 2.0) * cos(p.y * fi * 2.1 - t * 0.6) / fi;
  }

  float flame = smoothstep(0.08, 0.92, n * (1.45 + amplitude * 2.0) + 0.42);
  vec3 col = vec3(0.012, 0.008, 0.012);
  col += vec3(0.23, 0.03, 0.028) * flame;
  col += vec3(0.78, 0.12, 0.09) * pow(flame, 1.85) * (0.45 + amplitude * 0.9);

  float innerGlow = exp(-3.0 * dot(p, p));
  col += vec3(0.24, 0.04, 0.03) * innerGlow * (0.55 + amplitude);

  float vignette = smoothstep(1.2, 0.18, dot(uv * 1.15, uv * 1.15));
  col *= vignette;

  fragColor = vec4(col, 1.0);
}
`;

type AgentLifecycleViewProps = {
  agentConfig: AgentConfig;
  children: React.ReactNode;
};

export function AgentLifecycleView({ agentConfig, children }: AgentLifecycleViewProps) {
  const agent = useAgent();
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const timer = useSessionTimer(agent.isConnected, agent.isFinished);
  const hasEverConnected = useHasEverConnected(agent.state);
  const agentStartPath = `/${agentConfig.routeGroup}`;
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  // The initial useAgent state is 'disconnected' with isFinished=true, isPending=false.
  // We must NOT treat that as "session finished" — it's just the pre-connection state.
  // Show a full pre-connect noir screen before the user starts the session.
  if (!hasEverConnected && agent.state === 'disconnected') {
    return (
      <div className="relative flex h-screen items-center justify-center overflow-hidden">
        <ReactShaderToy
          fs={PRECONNECT_SHADER}
          uniforms={{ iAudioAmplitude: 0.05 }}
          className="absolute inset-0 h-full w-full"
        />

        <div className="relative z-10 flex max-w-xl flex-col items-center px-6 text-center">
          <h1 className="font-display text-[48px] font-[600] leading-tight text-[var(--noir-text)]">
            {agentConfig.displayName}
          </h1>
          <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.2em] text-[var(--noir-text-muted)]">
            {agentConfig.description}
          </p>
          <div className="my-6 w-20 border-t border-[var(--noir-accent)]" />

          <button
            type="button"
            disabled={starting}
            onClick={async () => {
              setStarting(true);
              setStartError('');
              try {
                await session.start();
              } catch {
                setStartError('Unable to start session. Please try again.');
              } finally {
                setStarting(false);
              }
            }}
            className="preconnect-start-btn rounded-[2px] px-8 py-3 font-mono text-[13px] uppercase tracking-[0.2em] transition-colors disabled:opacity-60"
          >
            {starting ? 'Starting...' : 'Start Session'}
          </button>

          {startError && (
            <p className="mt-3 text-xs text-[var(--noir-accent-bright)]">{startError}</p>
          )}
        </div>
      </div>
    );
  }

  // Failed state with errors (only after we've actually been through a non-disconnected state)
  if (hasEverConnected && agent.isFinished && agent.failureReasons && agent.failureReasons.length > 0) {
    return (
      <ErrorDisplay
        failureReasons={agent.failureReasons}
        agentStartPath={agentStartPath}
      />
    );
  }

  // Finished successfully (clean disconnect after a real session)
  if (hasEverConnected && agent.isFinished) {
    return (
      <PostSessionView
        duration={timer}
        messages={messages}
        agentStartPath={agentStartPath}
        agentName={agentConfig.displayName}
      />
    );
  }

  // For ALL other states — connecting, initializing, idle, listening, thinking, speaking —
  // show the full session UI. The session UI components gracefully handle the agent not
  // being fully ready yet (transcript shows "Waiting...", visualizer idles, status bar
  // shows "Connecting..." dot). This lets users see the session interface immediately
  // after the room connects, even before the agent joins.
  return (
    <>
      <StartAudioOverlay />
      {children}
    </>
  );
}

// Re-export agent state type for convenience
export type { AgentState };
