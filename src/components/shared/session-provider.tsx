'use client';

import { ThemeProvider } from '@/lib/theme';
import type { AgentConfig } from '@/lib/agents';

type TokenResponse = {
  token: string;
  sessionId: string;
  livekitUrl: string;
};

async function fetchAgentToken(
  agentConfig: AgentConfig,
  agentName?: string,
  metadata?: Record<string, unknown>
): Promise<TokenResponse> {
  const res = await fetch('/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: agentConfig.id,
      agentName: agentName || agentConfig.agentName,
      metadata,
    }),
  });
  if (!res.ok) {
    throw new Error('Failed to fetch token');
  }
  return res.json();
}

type AgentSessionWrapperProps = {
  agentConfig: AgentConfig;
  agentName?: string;
  metadata?: Record<string, unknown>;
  children: React.ReactNode;
};

export { fetchAgentToken };

export function AgentSessionWrapper({
  agentConfig,
  children,
}: AgentSessionWrapperProps) {
  return (
    <ThemeProvider theme={agentConfig.theme}>
      {children}
    </ThemeProvider>
  );
}
