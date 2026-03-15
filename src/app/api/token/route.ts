import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, RoomAgentDispatch, RoomConfiguration } from 'livekit-server-sdk';
import { getAgentById } from '@/lib/agents';
import { getAgentPassword, getLiveKitCredentials, normalizeAgentId } from '@/lib/server/env-config';
import { parseRequestBody, readObjectField, readStringField } from '@/lib/server/request-parsing';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const parsedBody = await parseRequestBody(req);
    if (!parsedBody.ok) {
      return NextResponse.json({ error: parsedBody.error }, { status: 400 });
    }

    const rawAgentId = readStringField(parsedBody.body, ['agentId', 'agent_id', 'agent']);
    const agentId = normalizeAgentId(rawAgentId);
    const agentNameFromRequest = readStringField(parsedBody.body, ['agentName', 'agent_name']);
    const metadata =
      readObjectField(parsedBody.body, ['metadata', 'meta', 'context']) ??
      undefined;

    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });
    }

    const agent = getAgentById(agentId);
    if (!agent) {
      return NextResponse.json({ error: 'Unknown agent' }, { status: 400 });
    }

    const cookie = req.cookies.get(`prmpt_access_${agentId}`);
    const isCookieAuthorized = !!cookie && cookie.value === 'validated';

    let isPasswordAuthorized = false;
    if (!isCookieAuthorized) {
      const password = readStringField(parsedBody.body, ['password', 'pass', 'accessToken', 'token']);
      if (password) {
        const passwordConfig = getAgentPassword(agentId);
        isPasswordAuthorized = passwordConfig?.value === password;
      }
    }

    if (!isCookieAuthorized && !isPasswordAuthorized) {
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
    const identity = `${agentId}-user-${crypto.randomUUID()}`;
    const agentName = agentNameFromRequest ?? agent.agentName;

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

    // Only add explicit agent dispatch if agentName is provided.
    // Agents using auto-dispatch (no agent_name registered) don't need this —
    // they automatically join any new room on their LiveKit project.
    if (agentName) {
      const dispatch = new RoomAgentDispatch();
      dispatch.agentName = agentName;
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
