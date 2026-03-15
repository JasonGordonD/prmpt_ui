import { NextRequest, NextResponse } from 'next/server';
import { AGENTS } from '@/lib/agents';

const agentRouteMap: Record<string, string> = {};
for (const agent of AGENTS) {
  agentRouteMap[agent.routeGroup] = agent.id;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/') || pathname === '/') {
    return NextResponse.next();
  }

  for (const [routeGroup, agentId] of Object.entries(agentRouteMap)) {
    if (pathname.startsWith(`/${routeGroup}`)) {
      const cookie = req.cookies.get(`prmpt_access_${agentId}`);
      if (!cookie || cookie.value !== 'validated') {
        const url = req.nextUrl.clone();
        url.pathname = '/';
        url.searchParams.set('agent', agentId);
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/(minka)/:path*', '/(coaching)/:path*', '/(lovebirds)/:path*', '/minka/:path*', '/coaching/:path*', '/lovebirds/:path*'],
};
