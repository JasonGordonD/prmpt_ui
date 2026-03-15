import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  let agentId: string | null = null;
  if (pathname.startsWith('/minka')) agentId = 'minka';
  else if (pathname.startsWith('/coaching')) agentId = 'coaching';
  else if (pathname.startsWith('/lovebirds')) agentId = 'lovebirds';
  else if (pathname.startsWith('/jrvs')) agentId = 'jrvs';
  else if (pathname.startsWith('/pack')) agentId = 'pack';

  if (agentId) {
    const cookie = request.cookies.get(`prmpt_access_${agentId}`);
    if (!cookie || cookie.value !== 'validated') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/minka/:path*',
    '/coaching/:path*',
    '/lovebirds/:path*',
    '/jrvs/:path*',
    '/pack/:path*',
  ],
};
