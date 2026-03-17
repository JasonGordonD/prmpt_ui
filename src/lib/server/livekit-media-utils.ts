import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { EgressClient, IngressClient } from 'livekit-server-sdk';
import { getLiveKitCredentials, isSupportedAgentId } from '@/lib/server/env-config';

type MediaClientResult =
  | {
      ok: true;
      agentId: string;
      egressClient: EgressClient;
      ingressClient: IngressClient;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function toBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const strings = value
    .map((entry) => asTrimmedString(entry))
    .filter((entry): entry is string => !!entry);
  return strings.length > 0 ? strings : undefined;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown LiveKit media error';
}

function normalizeLiveKitHost(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'ws:') parsed.protocol = 'http:';
    if (parsed.protocol === 'wss:') parsed.protocol = 'https:';
    return parsed.origin;
  } catch {
    return url;
  }
}

export function resolveAuthorizedMediaClients(
  req: NextRequest,
  rawAgentId: unknown
): MediaClientResult {
  const agentId = asTrimmedString(rawAgentId);

  if (!agentId || !isSupportedAgentId(agentId)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid or missing agentId' }, { status: 400 }),
    };
  }

  const cookie = req.cookies.get(`prmpt_access_${agentId}`);
  if (!cookie || cookie.value !== 'validated') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const envConfig = getLiveKitCredentials(agentId);
  if (!envConfig?.isConfigured || !envConfig.credentials) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'LiveKit not configured for this agent',
          missingKeys: process.env.NODE_ENV !== 'production' ? (envConfig?.missingKeys ?? []) : undefined,
          blankKeys: process.env.NODE_ENV !== 'production' ? (envConfig?.blankKeys ?? []) : undefined,
        },
        { status: 500 }
      ),
    };
  }

  const host = normalizeLiveKitHost(envConfig.credentials.url);
  return {
    ok: true,
    agentId,
    egressClient: new EgressClient(host, envConfig.credentials.apiKey, envConfig.credentials.apiSecret),
    ingressClient: new IngressClient(host, envConfig.credentials.apiKey, envConfig.credentials.apiSecret),
  };
}
