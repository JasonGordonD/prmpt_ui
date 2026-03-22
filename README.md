# PRMPT UI

Multi-agent Next.js frontend for PRMPT voice agents (Minka, Coaching, Lovebirds, JRVS, The Pack, Dr. Tijoux).

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

### Dr. Tijoux
- `LIVEKIT_API_KEY_TIJOUX`
- `LIVEKIT_API_SECRET_TIJOUX`
- `LIVEKIT_URL_TIJOUX`
- `AGENT_PASSWORD_TIJOUX`

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

## Frontend media updates (WO-UI-002)

- Live session UI now listens for incoming image byte streams on topics:
  - `agent-images` (agent-generated)
  - `images` (upload round-trip confirmations)
- User image uploads are sent via LiveKit byte stream `sendFile` on topic `images`.
- Chat media download controls are hardened to avoid same-tab navigation (download or new tab fallback only), preserving active voice sessions.
- Direct `.mp4` and `.webm` links in agent chat continue to render as inline video players.
- Session routes now use the Aura audio visualizer (`audioVisualizerType="aura"`) in place of the bar visualizer without layout repositioning.

## Frontend upload routing update (WO-UI-003)

- Frontend image uploads are routed to LiveKit byte-stream topic `images` so backend upload handlers receive binary image chunks.
- Non-image uploads continue to use non-image topics (`files` / `uploads`) depending on component flow.
- Upload UI "sent"/"failed" states are tied to `sendFile` completion outcomes (byte-stream send success/failure), not text metadata acknowledgements.

## Video player + image dedup + control bar compaction (WO-CURSOR-VIDEOPLAYER-N2-001)

- **N5 (pause/play coupling):** Ingress video cards now couple playback controls to ingress participant audio subscription:
  - pause/end on the video player unsubscribes ingress participant audio
  - play re-subscribes ingress participant audio
- **N6 (timeline layout containment):** Ingress video cards are constrained to transcript message width and now use CSS containment to prevent timeline layout breakage/overflow.
- **N2 (generated image dedup):** Generated image handling now reconciles byte-stream blob deliveries and `image_egress` URL payloads so a single generated image is shown in the timeline instead of duplicate blob+URL entries.
- **Bottom bar compaction:** `AgentControlBar` now renders as a single compact row:
  - media controls inline on the left (mic/screen/chat/upload + optional camera)
  - text input inline in the middle
  - END CALL on the right
  - session transcript/bottom spacing updated to match reduced control bar height.

## Typography system (2026 overhaul)

- Global font stack:
  - **Headers/titles/stat-scale text:** Space Grotesk (600; h3 uses 500)
  - **Body/UI text:** DM Sans (400 default, 500 emphasis)
  - **Code/monospace:** Courier Prime (unchanged for code semantics)
- Google font families are loaded from:
  - `https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;1,400&family=Space+Grotesk:wght@400;500;600&display=swap`
- Global scale baseline:
  - h1: 32px
  - h2: 22px
  - h3: 16px
  - body: 15px, line-height 1.7
  - small: 13px
  - caption/metadata: 11px
- Global text legibility backstop for aura overlap:
  - `text-shadow: 0 0 20px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.3)`

## In-place session start flow (WO-UI-004)

- Agent start pages now connect to LiveKit in-place on:
  - `/jrvs`
  - `/coaching`
  - `/minka`
  - `/lovebirds`
  - `/pack`
  - `/tijoux`
- The extra `/agent/session?token=...` transition is removed from the primary UX.
- Legacy `/agent/session` routes are retained only as redirects back to their agent root pages:
  - `/jrvs/session` → `/jrvs`
  - `/coaching/session` → `/coaching`
  - `/minka/session` → `/minka`
  - `/lovebirds/session` → `/lovebirds`
  - `/pack/session` → `/pack`
  - `/tijoux/session` → `/tijoux`
- Token generation and auth flow are unchanged: start button still calls `/api/token` with existing agent identifiers.

## Image upload support on all landing pages (WO-UI-005)

- Added `supportsImageUpload` prop to `AgentSessionView` on all 5 agent landing pages (JRVS, Minka, Coaching, The Pack, Lovebirds).

## Image upload delivery hardening after session consolidation (WO-CURSOR-IMAGEUPLOAD-001)

- Upload send path now verifies the room is actively connected before calling `sendFile`.
- Uploads are targeted to currently connected remote participant identities via `destinationIdentities` to avoid false-positive local send success with no active recipient.
- Image uploads continue to use topic `images`; non-image uploads keep their existing topics.
- This applies to active `AgentControlBar` uploads and shared upload components for consistency.

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
