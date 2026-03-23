import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { parseRequestBody, readStringField } from '@/lib/server/request-parsing';

export const runtime = 'nodejs';

type AgentPasswordConfig = {
  agentId: 'minka' | 'jrvs' | 'tijoux' | 'coaching' | 'pack' | 'lovebirds';
  routeGroup: 'minka' | 'jrvs' | 'tijoux' | 'coaching' | 'pack' | 'lovebirds';
  expectedPassword: string | undefined;
};

const AGENT_PASSWORDS: AgentPasswordConfig[] = [
  {
    agentId: 'minka',
    routeGroup: 'minka',
    expectedPassword: process.env.AGENT_PASSWORD_MINKA,
  },
  {
    agentId: 'jrvs',
    routeGroup: 'jrvs',
    expectedPassword: process.env.AGENT_PASSWORD_JRVS,
  },
  {
    agentId: 'tijoux',
    routeGroup: 'tijoux',
    expectedPassword: process.env.AGENT_PASSWORD_TIJOUX,
  },
  {
    agentId: 'coaching',
    routeGroup: 'coaching',
    expectedPassword: process.env.AGENT_PASSWORD_COACHING,
  },
  {
    agentId: 'pack',
    routeGroup: 'pack',
    expectedPassword: process.env.AGENT_PASSWORD_PACK,
  },
  {
    agentId: 'lovebirds',
    routeGroup: 'lovebirds',
    expectedPassword: process.env.AGENT_PASSWORD_LOVEBIRDS,
  },
];

const HEX_64_RE = /^[a-f0-9]{64}$/i;
const HEX_128_RE = /^[a-f0-9]{128}$/i;

function normalizeSecretValue(value: string): string {
  const withoutWhitespace = value.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
  if (
    (withoutWhitespace.startsWith('"') && withoutWhitespace.endsWith('"')) ||
    (withoutWhitespace.startsWith("'") && withoutWhitespace.endsWith("'"))
  ) {
    return withoutWhitespace.slice(1, -1);
  }

  return withoutWhitespace;
}

function safeStringEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

function hashSha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function hashSha512(value: string): string {
  return crypto.createHash('sha512').update(value).digest('hex');
}

function isValidPassword(password: string, expectedPassword: string): boolean {
  const normalizedInput = normalizeSecretValue(password);
  const normalizedExpected = normalizeSecretValue(expectedPassword);

  if (safeStringEquals(normalizedInput, normalizedExpected)) {
    return true;
  }

  const expectedLower = normalizedExpected.toLowerCase();
  if (HEX_64_RE.test(expectedLower) && safeStringEquals(hashSha256(normalizedInput), expectedLower)) {
    return true;
  }
  if (HEX_128_RE.test(expectedLower) && safeStringEquals(hashSha512(normalizedInput), expectedLower)) {
    return true;
  }

  const inputLower = normalizedInput.toLowerCase();
  if (HEX_64_RE.test(inputLower) && safeStringEquals(hashSha256(normalizedExpected), inputLower)) {
    return true;
  }
  if (HEX_128_RE.test(inputLower) && safeStringEquals(hashSha512(normalizedExpected), inputLower)) {
    return true;
  }

  return false;
}

function resolveAgent(password: string): AgentPasswordConfig | undefined {
  for (const config of AGENT_PASSWORDS) {
    if (!config.expectedPassword) {
      continue;
    }

    if (isValidPassword(password, config.expectedPassword)) {
      return config;
    }
  }

  return undefined;
}

export async function POST(req: NextRequest) {
  const parsedBody = await parseRequestBody(req);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: 400 });
  }

  const password = readStringField(parsedBody.body, ['password']);
  if (!password) {
    return NextResponse.json({ error: 'Missing password' }, { status: 400 });
  }

  const match = resolveAgent(password);
  if (!match) {
    return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
  }

  const response = NextResponse.json({ agentId: match.agentId, routeGroup: match.routeGroup });
  response.cookies.set(`prmpt_access_${match.agentId}`, 'validated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  return response;
}
