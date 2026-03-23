'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type ResolveAuthResponse = {
  routeGroup: string;
};

export default function Home() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedPassword = password.trim();
    if (!trimmedPassword || loading) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: trimmedPassword }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Invalid access code');
        } else {
          setError('Unable to verify access code');
        }
        return;
      }

      const data = (await response.json()) as ResolveAuthResponse;
      if (!data?.routeGroup) {
        setError('Unable to verify access code');
        return;
      }

      router.push(`/${data.routeGroup}`);
    } catch {
      setError('Unable to verify access code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-center text-5xl font-semibold tracking-tight font-display">PRMPT</h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) {
                setError('');
              }
            }}
            placeholder="Enter access code"
            autoFocus
            disabled={loading}
            className="w-full rounded-xl border border-[#303030] bg-[#131313] px-4 py-3 text-base text-white placeholder:text-[#7f7f7f] focus:border-[#4b4b4b] focus:outline-none disabled:opacity-70"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full rounded-xl border border-[#3d3d3d] bg-[#191919] px-4 py-3 text-sm font-medium uppercase tracking-[0.12em] text-[#f1f1f1] transition-colors hover:bg-[#232323] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Verifying...' : 'Enter'}
          </button>
        </form>
      </div>
    </main>
  );
}
