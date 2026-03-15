import { NextResponse } from 'next/server';

// Temporary diagnostic endpoint — shows which LiveKit env vars are set (not their values).
// Uses explicit static references because Next.js can't resolve dynamic process.env lookups.
// DELETE this file once JRVS + Pack are confirmed working.
export async function GET() {
  return NextResponse.json({
    jrvs: {
      LIVEKIT_API_KEY_JRVS: !!process.env.LIVEKIT_API_KEY_JRVS,
      LIVEKIT_API_SECRET_JRVS: !!process.env.LIVEKIT_API_SECRET_JRVS,
      LIVEKIT_URL_JRVS: !!process.env.LIVEKIT_URL_JRVS,
      AGENT_PASSWORD_JRVS: !!process.env.AGENT_PASSWORD_JRVS,
    },
    pack: {
      LIVEKIT_API_KEY_PACK: !!process.env.LIVEKIT_API_KEY_PACK,
      LIVEKIT_API_SECRET_PACK: !!process.env.LIVEKIT_API_SECRET_PACK,
      LIVEKIT_URL_PACK: !!process.env.LIVEKIT_URL_PACK,
      AGENT_PASSWORD_THEPACK: !!process.env.AGENT_PASSWORD_THEPACK,
    },
    minka: {
      LIVEKIT_API_KEY_MINKA: !!process.env.LIVEKIT_API_KEY_MINKA,
    },
    coaching: {
      LIVEKIT_API_KEY_COACHING: !!process.env.LIVEKIT_API_KEY_COACHING,
    },
    lovebirds: {
      LIVEKIT_API_KEY_LOVEBIRDS: !!process.env.LIVEKIT_API_KEY_LOVEBIRDS,
    },
  });
}
