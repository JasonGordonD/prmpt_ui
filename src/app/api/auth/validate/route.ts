import { NextRequest, NextResponse } from 'next/server';
import { getAgentPassword, normalizeAgentId } from '@/lib/server/env-config';
import { parseRequestBody, readStringField } from '@/lib/server/request-parsing';

export const runtime = 'nodejs';

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

  if (!expectedPassword || password !== expectedPassword) {
    if (!expectedPassword) {
      console.error(`[auth] Password env missing for agent "${agentId}":`, {
        missingKeys: passwordConfig?.missingKeys ?? [],
        blankKeys: passwordConfig?.blankKeys ?? [],
        resolvedKey: passwordConfig?.resolvedKey,
        candidateKeys: passwordConfig?.candidateKeys ?? [],
      });
    }
    return NextResponse.json({ valid: false }, { status: 401 });
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
