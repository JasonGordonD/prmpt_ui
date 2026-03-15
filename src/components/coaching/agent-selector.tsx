'use client';

type CoachingAgent = {
  id: string;
  name: string;
  description: string;
  agentName: string;
  accent: string;
};

const COACHING_AGENTS: CoachingAgent[] = [
  {
    id: 'ara-dc',
    name: 'Ara Thompson (DC)',
    description: 'Washington DC executive coaching with government and policy focus',
    agentName: 'exec-coach-primary',
    accent: '#1a365d',
  },
  {
    id: 'ara-toronto',
    name: 'Ara Thompson (Toronto)',
    description: 'Toronto-based coaching with international business perspective',
    agentName: 'exec-coach-primary',
    accent: '#134e4a',
  },
  {
    id: 'ara-global',
    name: 'Ara Thompson (Global)',
    description: 'Global executive coaching across industries and cultures',
    agentName: 'exec-coach-primary',
    accent: '#2d3748',
  },
  {
    id: 'ara-dark-mode',
    name: 'Ara Thompson (Dark Mode)',
    description: 'Deep shadow work and transformative coaching',
    agentName: 'exec-coach-primary',
    accent: '#3b1a5e',
  },
  {
    id: 'central',
    name: 'Central Routing',
    description: 'Smart routing to the best coaching experience for you',
    agentName: 'exec-coach-primary',
    accent: '#4a5568',
  },
];

type AgentSelectorProps = {
  onSelect: (agentName: string) => void;
};

export function CoachingAgentSelector({ onSelect }: AgentSelectorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center space-y-3 mb-10">
        <h1 className="text-3xl font-bold text-[var(--text)]">Executive Coaching</h1>
        <p className="text-[var(--text-muted)] text-sm">Select your coaching experience</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
        {COACHING_AGENTS.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onSelect(agent.agentName)}
            className="text-left p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] transition-all group"
          >
            <div className="flex items-start gap-3">
              <div
                className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                style={{ backgroundColor: agent.accent }}
              />
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                  {agent.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {agent.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
