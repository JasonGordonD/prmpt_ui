'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AGENTS, type AgentConfig } from '@/lib/agents';
import { ChevronDown } from 'lucide-react';

export function LandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const agentParam = searchParams.get('agent');
    if (agentParam) {
      const found = AGENTS.find((a) => a.id === agentParam);
      if (found) setSelectedAgent(found);
    }
  }, [searchParams]);

  const handleSelect = (agent: AgentConfig) => {
    setSelectedAgent(agent);
    setPassword('');
    setError('');
    setDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent.id, password }),
      });

      const data = await res.json();

      if (data.valid) {
        router.push(`/${selectedAgent.routeGroup}`);
      } else {
        setError('Invalid password. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-white">PRMPT</span>
          </h1>
          <p className="text-[#888] text-sm">Voice AI Agent Platform</p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-left hover:border-[#555] transition-colors"
            >
              <span className={selectedAgent ? 'text-white' : 'text-[#666]'}>
                {selectedAgent ? selectedAgent.displayName : 'Select an agent...'}
              </span>
              <ChevronDown className={`w-4 h-4 text-[#666] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-[#1a1a1a] border border-[#333] rounded-lg overflow-hidden shadow-xl">
                {AGENTS.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => handleSelect(agent)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#252525] transition-colors text-left"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: agent.theme.primary }}
                    />
                    <div>
                      <div className="text-sm font-medium text-white">{agent.displayName}</div>
                      <div className="text-xs text-[#888]">{agent.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedAgent && (
            <div className="animate-fade-in space-y-4">
              <div
                className="px-4 py-3 rounded-lg border text-sm"
                style={{
                  backgroundColor: selectedAgent.theme.surface,
                  borderColor: selectedAgent.theme.border,
                  color: selectedAgent.theme.textMuted,
                }}
              >
                {selectedAgent.description}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-[#555] outline-none focus:border-[#555] transition-colors"
                  autoFocus
                />

                {error && (
                  <p className="text-red-400 text-sm animate-fade-in">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full py-3 rounded-lg font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: selectedAgent.theme.primary }}
                >
                  {loading ? 'Validating...' : 'Enter'}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-[#444] text-xs">
          Powered by PRMPT
        </p>
      </div>
    </div>
  );
}
