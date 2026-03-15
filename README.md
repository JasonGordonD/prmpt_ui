# PRMPT UI

Multi-agent Next.js frontend for PRMPT voice agents (Minka, Coaching, Lovebirds, JRVS, The Pack).

## Getting started

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required environment variables

Each agent requires three LiveKit credentials and one access password.

### Minka
- `LIVEKIT_API_KEY_MINKA`
- `LIVEKIT_API_SECRET_MINKA`
- `LIVEKIT_URL_MINKA`
- `AGENT_PASSWORD_MINKA`

### Coaching
- `LIVEKIT_API_KEY_COACHING`
- `LIVEKIT_API_SECRET_COACHING`
- `LIVEKIT_URL_COACHING`
- `AGENT_PASSWORD_COACHING`

### Lovebirds
- `LIVEKIT_API_KEY_LOVEBIRDS`
- `LIVEKIT_API_SECRET_LOVEBIRDS`
- `LIVEKIT_URL_LOVEBIRDS`
- `AGENT_PASSWORD_LOVEBIRDS`

### JRVS
- `LIVEKIT_API_KEY_JRVS`
- `LIVEKIT_API_SECRET_JRVS`
- `LIVEKIT_URL_JRVS`
- `AGENT_PASSWORD_JRVS`

### The Pack
- `LIVEKIT_API_KEY_PACK` *(preferred)* or `LIVEKIT_API_KEY_THEPACK` *(legacy alias)*
- `LIVEKIT_API_SECRET_PACK` *(preferred)* or `LIVEKIT_API_SECRET_THEPACK` *(legacy alias)*
- `LIVEKIT_URL_PACK` *(preferred)* or `LIVEKIT_URL_THEPACK` *(legacy alias)*
- `AGENT_PASSWORD_PACK` *(preferred)* or `AGENT_PASSWORD_THEPACK` *(legacy alias)*

## Deployment checklist (Vercel)

1. Add all required variables in Vercel Project Settings → Environment Variables.
2. Ensure variables are set for the correct scope (**Production**, and optionally Preview/Development).
3. Redeploy after env var updates.
4. Verify:
   - `/api/debug/env` shows expected env presence booleans.
   - `/jrvs` → Start Session calls `/api/token` without `LiveKit not configured for this agent` errors.

## Notes

- JRVS currently uses named dispatch and sends `agentName="JRVS"` in token requests.
- The Pack supports both `*_PACK` and legacy `*_THEPACK` env var names.
