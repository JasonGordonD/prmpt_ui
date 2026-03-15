import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, RoomAgentDispatch, RoomConfiguration } from 'livekit-server-sdk';
import { getAgentById } from '@/lib/agents';
import crypto from 'crypto';

// Explicit env var references ensure Next.js includes them in the serverless bundle.
// Dynamic process.env[variable] lookups are not statically analyzable and fail at runtime.
function getLiveKitCredentials(agentId: string): { apiKey: string; apiSecret: string; url: string } | undefined {
  switch (agentId) {
    case 'minka': return {
      apiKey: process.env.LIVEKIT_API_KEY_MINKA!,
      apiSecret: process.env.LIVEKIT_API_SECRET_MINKA!,
      url: process.env.LIVEKIT_URL_MINKA!,
    };
    case 'coaching': return {
      apiKey: process.env.LIVEKIT_API_KEY_COACHING!,
      apiSecret: process.env.LIVEKIT_API_SECRET_COACHING!,
      url: process.env.LIVEKIT_URL_COACHING!,
    };
    case 'lovebirds': return {
      apiKey: process.env.LIVEKIT_API_KEY_LOVEBIRDS!,
      apiSecret: process.env.LIVEKIT_API_SECRET_LOVEBIRDS!,
      url: process.env.LIVEKIT_URL_LOVEBIRDS!,
    };
    case 'jrvs': return {
      apiKey: process.env.LIVEKIT_API_KEY_JRVS!,
      apiSecret: process.env.LIVEKIT_API_SECRET_JRVS!,
      url: process.env.LIVEKIT_URL_JRVS!,
    };
    case 'pack': return {
      apiKey: process.env.LIVEKIT_API_KEY_PACK!,
      apiSecret: process.env.LIVEKIT_API_SECRET_PACK!,
      url: process.env.LIVEKIT_URL_PACK!,
    };
    default: return undefined;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { agentId, agentName, metadata } = await req.json();

    if (!agentId || !agentName) {
      return NextResponse.json({ error: 'Missing agentId or agentName' }, { status: 400 });
    }

    const agent = getAgentById(agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Unknown agent' }, { status: 400 });
    }

    const cookie = req.cookies.get(`prmpt_access_${agentId}`);
    if (!cookie || cookie.value !== 'validated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creds = getLiveKitCredentials(agentId);
    if (!creds || !creds.apiKey || !creds.apiSecret || !creds.url) {
      return NextResponse.json({ error: 'LiveKit not configured for this agent' }, { status: 500 });
    }

    const apiKey = creds.apiKey.trim();
    const apiSecret = creds.apiSecret.trim();
    const livekitUrl = creds.url.trim();

    const sessionId = `${agentId}-${crypto.randomUUID()}`;
    const identity = `${agentId}-user-${crypto.randomUUID()}`;

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

    const dispatch = new RoomAgentDispatch();
    dispatch.agentName = agentName;
    if (metadata && Object.keys(metadata).length > 0) {
      dispatch.metadata = JSON.stringify(metadata);
    }

    const roomConfig = new RoomConfiguration();
    roomConfig.agents = [dispatch];
    at.roomConfig = roomConfig;

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
