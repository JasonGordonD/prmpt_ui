import { NextRequest, NextResponse } from 'next/server';
import { getAgentById } from '@/lib/agents';

export async function POST(req: NextRequest) {
  try {
    const { agentId, password } = await req.json();

    if (!agentId || !password) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const agent = getAgentById(agentId);
    if (!agent) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const expectedPassword = process.env[agent.passwordEnvKey];
    if (!expectedPassword || password !== expectedPassword) {
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
