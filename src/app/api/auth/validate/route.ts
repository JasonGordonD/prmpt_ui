import { NextRequest, NextResponse } from 'next/server';

// TEMPORARY HARDCODE — env vars not resolving in Vercel serverless functions.
// Move back to process.env[agent.passwordEnvKey] once Vercel env var issue is diagnosed.
const PASSWORDS: Record<string, string> = {
  minka: 'MinkaKG1',
  coaching: 'PRMPTec1',
  lovebirds: 'Luvisblind1',
};

export async function POST(req: NextRequest) {
  try {
    const { agentId, password } = await req.json();

    if (!agentId || !password) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const expectedPassword = PASSWORDS[agentId];
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
