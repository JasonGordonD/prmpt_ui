import { ThemeProvider } from '@/lib/theme';
import { AGENTS } from '@/lib/agents';

const minkaConfig = AGENTS.find((a) => a.id === 'minka')!;

export default function MinkaLayout({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={minkaConfig.theme}>{children}</ThemeProvider>;
}
