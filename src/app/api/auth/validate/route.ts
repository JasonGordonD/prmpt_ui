import { NextRequest, NextResponse } from 'next/server';
import { getAgentPassword, normalizeAgentId } from '@/lib/server/env-config';
import { parseRequestBody, readStringField } from '@/lib/server/request-parsing';
import crypto from 'crypto';

export const runtime = 'nodejs';

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

export async function POST(req: NextRequest) {
  const parsedBody = await parseRequestBody(req);
  if (!parsedBody.ok) {
    return NextResponse.json({ valid: false, error: parsedBody.error }, { status: 400 });
  }

  const rawAgentId = readStringField(parsedBody.body, ['agentId', 'agent_id', 'agent']);
  const password = readStringField(parsedBody.body, ['password', 'pass', 'accessToken', 'token']);
  const agentId = normalizeAgentId(rawAgentId);

  if (!agentId || !password) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const passwordConfig = getAgentPassword(agentId);
  const expectedPassword = passwordConfig?.value;

  if (!expectedPassword) {
    console.error(`[auth] Password env missing for agent "${agentId}":`, {
      missingKeys: passwordConfig?.missingKeys ?? [],
      blankKeys: passwordConfig?.blankKeys ?? [],
      resolvedKey: passwordConfig?.resolvedKey,
      candidateKeys: passwordConfig?.candidateKeys ?? [],
    });
    return NextResponse.json(
      { valid: false, errorCode: 'PASSWORD_NOT_CONFIGURED' },
      { status: 500 }
    );
  }

  if (!isValidPassword(password, expectedPassword)) {
    return NextResponse.json({ valid: false, errorCode: 'INVALID_PASSWORD' }, { status: 401 });
  }

  const response = NextResponse.json({ valid: true });
  response.cookies.set(`prmpt_access_${agentId}`, 'validated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  return response;
}
