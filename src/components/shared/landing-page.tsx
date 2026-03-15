'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AGENTS, type AgentConfig } from '@/lib/agents';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';

export function LandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      } else if (data.errorCode === 'PASSWORD_NOT_CONFIGURED') {
        setError('Password is not configured for this agent in this environment.');
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
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-[#ededed]">PRMPT</h1>
          <p className="text-[#888] text-sm">Voice AI Agent Platform</p>
        </div>

        <div className="space-y-4">
          {/* Agent dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-xl text-left btn-interactive"
            >
              <span className={selectedAgent ? 'text-[#ededed]' : 'text-[#666]'}>
                {selectedAgent ? selectedAgent.displayName : 'Select an agent...'}
              </span>
              <ChevronDown className={`w-4 h-4 text-[#666] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden shadow-xl animate-fade-in">
                {AGENTS.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => handleSelect(agent)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#252525] transition-colors text-left btn-interactive"
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: agent.theme.primary }}
                    />
                    <div>
                      <div className="text-sm font-medium text-[#ededed]">{agent.displayName}</div>
                      <div className="text-xs text-[#888]">{agent.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected agent details + password form */}
          {selectedAgent && (
            <div className="animate-fade-in space-y-4">
              <div
                className="px-4 py-3 rounded-xl border text-sm"
                style={{
                  backgroundColor: selectedAgent.theme.surface,
                  borderColor: selectedAgent.theme.border,
                  color: selectedAgent.theme.textMuted,
                }}
              >
                {selectedAgent.description}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 pr-11 bg-[#1a1a1a] border border-[#333] rounded-xl text-[#ededed] placeholder-[#555] transition-colors"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#999] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && (
                  <p className="text-red-400 text-sm animate-fade-in">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full py-3 rounded-lg font-medium text-white btn-interactive min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: selectedAgent.theme.primary }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
                      Validating...
                    </>
                  ) : (
                    'Enter'
                  )}
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
