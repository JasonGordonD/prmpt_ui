import { NextResponse } from 'next/server';
import { getEnvPresenceByAgent, getLiveKitCredentials, getAgentPassword } from '@/lib/server/env-config';

// Temporary diagnostic endpoint — shows which LiveKit env vars are set (not their values).
// Uses centralized env mappings to avoid drift.
// DELETE or protect this endpoint once JRVS + Pack are confirmed working.
export async function GET() {
  const envPresence = getEnvPresenceByAgent();

  return NextResponse.json({
    envPresence,
    diagnostics: {
      jrvs: {
        livekitConfigured: !!getLiveKitCredentials('jrvs')?.isConfigured,
        authConfigured: !!getAgentPassword('jrvs')?.isConfigured,
      },
      pack: {
        livekitConfigured: !!getLiveKitCredentials('pack')?.isConfigured,
        authConfigured: !!getAgentPassword('pack')?.isConfigured,
      },
    },
  });
}
