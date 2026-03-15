import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, RoomAgentDispatch, RoomConfiguration } from 'livekit-server-sdk';
import { getAgentById } from '@/lib/agents';
import crypto from 'crypto';

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

    const prefix = agent.livekitEnvPrefix;
    const apiKey = process.env[`LIVEKIT_API_KEY_${prefix}`];
    const apiSecret = process.env[`LIVEKIT_API_SECRET_${prefix}`];
    const livekitUrl = process.env[`LIVEKIT_URL_${prefix}`];
    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json({ error: 'LiveKit not configured for this agent' }, { status: 500 });
    }

    const sessionId = `${agentId}-${crypto.randomUUID()}`;
    const identity = `${agentId}-user-${crypto.randomUUID()}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      ttl: '1h',
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });

    at.addGrant({
      roomJoin: true,
      room: sessionId,
      canPublish: true,
      canSubscribe: true,
    });

    const dispatch = new RoomAgentDispatch();
    dispatch.agentName = agentName;
    if (metadata) {
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
