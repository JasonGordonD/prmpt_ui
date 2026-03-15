import { NextRequest, NextResponse } from 'next/server';
import { getAgentPassword } from '@/lib/server/env-config';

export async function POST(req: NextRequest) {
  try {
    const { agentId, password } = await req.json();

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
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
