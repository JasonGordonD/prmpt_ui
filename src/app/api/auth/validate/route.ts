import { NextRequest, NextResponse } from 'next/server';

// Explicit env var references ensure Next.js includes them in the serverless bundle.
// Dynamic process.env[variable] lookups are not statically analyzable and fail at runtime.
function getAgentPassword(agentId: string): string | undefined {
  switch (agentId) {
    case 'minka': return process.env.AGENT_PASSWORD_MINKA;
    case 'coaching': return process.env.AGENT_PASSWORD_COACHING;
    case 'lovebirds': return process.env.AGENT_PASSWORD_LOVEBIRDS;
    case 'jrvs': return process.env.AGENT_PASSWORD_JRVS;
    case 'pack': return process.env.AGENT_PASSWORD_THEPACK;
    default: return undefined;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { agentId, password } = await req.json();

    if (!agentId || !password) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const expectedPassword = getAgentPassword(agentId);
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
