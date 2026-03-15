'use client';

import { createContext, useContext } from 'react';
import type { AgentConfig } from './agents';

type ThemeColors = AgentConfig['theme'];

const ThemeContext = createContext<ThemeColors | null>(null);

export function useTheme(): ThemeColors | null {
  return useContext(ThemeContext);
}

export function ThemeProvider({
  theme,
  children,
}: {
  theme: ThemeColors;
  children: React.ReactNode;
}) {
  return (
    <ThemeContext.Provider value={theme}>
      <div
        style={
          {
            '--bg': theme.background,
            '--surface': theme.surface,
            '--primary': theme.primary,
            '--accent': theme.accent,
            '--text': theme.text,
            '--text-muted': theme.textMuted,
            '--border': theme.border,
            '--background': theme.background,
            '--foreground': theme.text,
          } as React.CSSProperties
        }
        className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
