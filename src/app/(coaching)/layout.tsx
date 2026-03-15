import { ThemeProvider } from '@/lib/theme';
import { AGENTS } from '@/lib/agents';

const coachingConfig = AGENTS.find((a) => a.id === 'coaching')!;

export default function CoachingLayout({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={coachingConfig.theme}>{children}</ThemeProvider>;
}
