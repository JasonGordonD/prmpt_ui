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

## LiveKit stream export/import API

The app includes authenticated server routes for LiveKit media export/import (Egress + Ingress).

- `GET /api/livekit/egress?agentId=<id>&roomName=<optional>&active=<optional>`
  - List egress jobs for an agent/project.
- `POST /api/livekit/egress`
  - `action: "start_room_composite"`: start room recording/stream export.
  - `action: "stop"`: stop an egress job by `egressId`.
  - `action: "update_stream"`: add/remove RTMP output URLs for active stream egress.

- `GET /api/livekit/ingress?agentId=<id>&roomName=<optional>&ingressId=<optional>`
  - List ingress jobs for an agent/project.
- `POST /api/livekit/ingress`
  - `action: "create"`: create ingress (`inputType`: `rtmp` | `whip` | `url`).
  - `action: "delete"`: delete ingress by `ingressId`.

All routes require a validated agent auth cookie (`prmpt_access_<agentId>`) and use the same per-agent LiveKit credentials used by `/api/token`.

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

## Deployment + rollback references (2026-03-16 overhaul)

### Production deployment target

- Project URL: https://prmpt-ui.vercel.app
- Git deploy source: `main` branch
- Overhaul rollout refs (in order):
  - `b518767` — UI-01 foundation
  - `a433dcc` — UI-02 noir system
  - `e28620b` — UI-03 shader
  - `329a49b` — UI-04 screenshare
  - `9ffb886` — UI-05 bubbles
  - `2038398` — UI-06 status bar
  - `eff0c0b` — UI-07 control bar
  - `27f5892` — UI-08 autoscroll
  - `ebd63a3` — UI-09 upload stream
  - `91ad967` — UI-10 media downloads
  - `0bc4e43` — UI-11 token identity map
  - `1633ade` — UI-12 copy/export polish
  - `1062267` — UI-13 pre-connect screen

### Rollback references

- Last known pre-overhaul baseline: `19487c5`
- Per-section rollback points:
  - after UI-01: `b518767`
  - after UI-02: `a433dcc`
  - after UI-03: `e28620b`
  - after UI-04: `329a49b`
  - after UI-05: `9ffb886`
  - after UI-06: `2038398`
  - after UI-07: `eff0c0b`
  - after UI-08: `27f5892`
  - after UI-09: `ebd63a3`
  - after UI-10: `91ad967`
  - after UI-11: `0bc4e43`
  - after UI-12: `1633ade`
  - after UI-13: `1062267`

### Rollback procedure (Vercel)

1. Open the Vercel project for `prmpt_ui`.
2. Select a deployment generated from the desired rollback commit above.
3. Promote/redeploy that commit to Production.
4. Verify `/api/debug/env` and start-session flow for each agent route.
