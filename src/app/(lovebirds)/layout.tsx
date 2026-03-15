import { ThemeProvider } from '@/lib/theme';
import { AGENTS } from '@/lib/agents';

const lovebirdsConfig = AGENTS.find((a) => a.id === 'lovebirds')!;

export default function LovebirdsLayout({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={lovebirdsConfig.theme}>{children}</ThemeProvider>;
}
