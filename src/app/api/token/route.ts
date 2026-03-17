import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, RoomAgentDispatch, RoomConfiguration } from 'livekit-server-sdk';
import { getAgentById } from '@/lib/agents';
import { getLiveKitCredentials } from '@/lib/server/env-config';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { agentId, agentName, metadata, agentPassword } = await req.json();

    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });
    }

    const agent = getAgentById(agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Unknown agent' }, { status: 400 });
    }

    const cookie = req.cookies.get(`prmpt_access_${agentId}`);
    if (!cookie || cookie.value !== 'validated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const envConfig = getLiveKitCredentials(agentId);
    if (!envConfig || !envConfig.isConfigured || !envConfig.credentials) {
      console.error(`[token] LiveKit not configured for agent "${agentId}":`, {
        missingKeys: envConfig?.missingKeys ?? [],
        blankKeys: envConfig?.blankKeys ?? [],
        resolvedKeys: envConfig?.resolvedKeys,
        candidateKeys: envConfig?.candidateKeys,
        nodeEnv: process.env.NODE_ENV,
      });

      const payload: { error: string; missingKeys?: string[]; blankKeys?: string[] } = {
        error: 'LiveKit not configured for this agent',
      };

      if (process.env.NODE_ENV !== 'production') {
        payload.missingKeys = envConfig?.missingKeys ?? [];
        payload.blankKeys = envConfig?.blankKeys ?? [];
      }

      return NextResponse.json(payload, { status: 500 });
    }

    const apiKey = envConfig.credentials.apiKey;
    const apiSecret = envConfig.credentials.apiSecret;
    const livekitUrl = envConfig.credentials.url;

    const sessionId = `${agentId}-${crypto.randomUUID()}`;
    const identityMap: Record<string, string> = {
      ER407: 'rami',
      Luvisblind1: 'lovebirds-user',
    };
    const participantIdentity = identityMap[agentPassword] ?? `user-${crypto.randomUUID()}`;
    const identity = participantIdentity;

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      ttl: '1h',
      metadata: metadata && Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : undefined,
    });

    at.addGrant({
      roomJoin: true,
      room: sessionId,
      canPublish: true,
      canSubscribe: true,
    });

    // Resolve agent name: prefer explicit request body value, fall back to agent config.
    const resolvedAgentName = agentName || agent.agentName;

    // Only add explicit agent dispatch if an agent name is available.
    if (resolvedAgentName) {
      const dispatch = new RoomAgentDispatch();
      dispatch.agentName = resolvedAgentName;
      if (metadata && Object.keys(metadata).length > 0) {
        dispatch.metadata = JSON.stringify(metadata);
      }

      const roomConfig = new RoomConfiguration();
      roomConfig.agents = [dispatch];
      at.roomConfig = roomConfig;
    }

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      sessionId,
      livekitUrl,
    });
  } catch (err) {
    console.error('Token generation error:', err);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
