'use client';

import { ThemeProvider } from '@/lib/theme';
import type { AgentConfig } from '@/lib/agents';

type AgentSessionWrapperProps = {
  agentConfig: AgentConfig;
  children: React.ReactNode;
};

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
