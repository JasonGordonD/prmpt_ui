import { ThemeProvider } from '@/lib/theme';
import { AGENTS } from '@/lib/agents';

const jrvsConfig = AGENTS.find((a) => a.id === 'jrvs')!;

export default function JrvsLayout({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={jrvsConfig.theme}>{children}</ThemeProvider>;
}
