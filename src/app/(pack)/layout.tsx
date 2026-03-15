import { ThemeProvider } from '@/lib/theme';
import { AGENTS } from '@/lib/agents';

const packConfig = AGENTS.find((a) => a.id === 'pack')!;

export default function PackLayout({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={packConfig.theme}>{children}</ThemeProvider>;
}
