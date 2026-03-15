import { NextResponse } from 'next/server';

// Temporary diagnostic endpoint — shows which LiveKit env vars are set (not their values).
// DELETE this file once JRVS + Pack are confirmed working.
export async function GET() {
  const check = (name: string) => !!process.env[name];

  return NextResponse.json({
    jrvs: {
      LIVEKIT_API_KEY_JRVS: check('LIVEKIT_API_KEY_JRVS'),
      LIVEKIT_API_SECRET_JRVS: check('LIVEKIT_API_SECRET_JRVS'),
      LIVEKIT_URL_JRVS: check('LIVEKIT_URL_JRVS'),
      AGENT_PASSWORD_JRVS: check('AGENT_PASSWORD_JRVS'),
    },
    pack: {
      LIVEKIT_API_KEY_PACK: check('LIVEKIT_API_KEY_PACK'),
      LIVEKIT_API_SECRET_PACK: check('LIVEKIT_API_SECRET_PACK'),
      LIVEKIT_URL_PACK: check('LIVEKIT_URL_PACK'),
      AGENT_PASSWORD_THEPACK: check('AGENT_PASSWORD_THEPACK'),
    },
    minka: {
      LIVEKIT_API_KEY_MINKA: check('LIVEKIT_API_KEY_MINKA'),
    },
    coaching: {
      LIVEKIT_API_KEY_COACHING: check('LIVEKIT_API_KEY_COACHING'),
    },
    lovebirds: {
      LIVEKIT_API_KEY_LOVEBIRDS: check('LIVEKIT_API_KEY_LOVEBIRDS'),
    },
  });
}
