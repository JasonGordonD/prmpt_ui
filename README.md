# PRMPT UI

Voice AI Agent Platform — a Next.js frontend for real-time voice sessions with LiveKit-powered agents.

## Agents

| Agent | Route | Description |
|-------|-------|-------------|
| **Minka Moor** | `/minka` | Voice experience with Minka Moor |
| **Executive Coaching** | `/coaching` | Premium executive coaching with Ara Thompson |
| **Lovebirds** | `/lovebirds` | AI couples mediation with Raven Voss |

## Architecture

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (SpeedInsights, fonts, global CSS)
│   ├── (minka)/minka/                # Minka landing + session pages
│   ├── (coaching)/coaching/          # Coaching landing + session pages
│   ├── (lovebirds)/lovebirds/       # Lovebirds landing + session pages
│   └── api/
│       ├── token/route.ts            # LiveKit token generation + agent dispatch
│       ├── auth/validate/route.ts    # Password validation per agent
│       ├── minka/session/[id]/       # Minka post-session data (Supabase)
│       ├── coaching/session/[id]/    # Coaching post-session data
│       └── lovebirds/               # Lovebirds session, couple, transcript APIs
├── components/
│   ├── shared/
│   │   ├── session-wrapper.tsx       # LiveKit session + room connection + RoomAudioRenderer
│   │   ├── agent-lifecycle-view.tsx  # Guards: connecting → couldn't connect → error → post-session → active
│   │   ├── status-bar.tsx            # Agent state, connection quality, node, LLM, sentiment, timer
│   │   ├── control-bar.tsx           # Mic toggle, chat (with message history), file upload, leave
│   │   ├── base-transcript.tsx       # Real-time transcript with markdown rendering
│   │   ├── visualizer-wrapper.tsx    # 5 audio visualizer types (aura, wave, radial, bar, grid)
│   │   ├── post-session-view.tsx     # Session complete screen with transcript export
│   │   ├── error-display.tsx         # Error screen with failure reasons + retry
│   │   ├── landing-page.tsx          # Shared landing page template
│   │   └── file-upload.tsx           # File upload component
│   ├── agents-ui/                    # Audio visualizer implementations
│   └── lovebirds/                    # Lovebirds-specific: scorekeeper, diarized transcript, handoff
├── hooks/
│   ├── use-has-ever-connected.ts     # Tracks hasStartedConnecting + hasBeenInteractive flags
│   ├── use-session-timer.ts          # Elapsed time counter (only counts when agent is interactive)
│   ├── use-node-state.ts             # Maps agent node attributes to display info
│   ├── use-scorekeeper.ts            # Lovebirds scorekeeper data parsing
│   └── use-sentiment.ts              # Sentiment data parsing from agent attributes
└── lib/
    ├── agents.ts                     # Agent configs (id, theme, nodeMap) for all 3 agents
    ├── supabase.ts                   # Supabase client
    ├── theme.tsx                     # CSS variable theme provider
    └── utils.ts                      # Shared utilities
```

## Session Lifecycle

Each agent session follows this flow:

1. **Landing page** → User clicks "Call [Agent]"
2. **Token generation** → `/api/token` creates a LiveKit access token with agent dispatch
3. **Session connection** → `SessionWrapper` connects to the LiveKit room, starts microphone
4. **Lifecycle guards** (`AgentLifecycleView`):
   - `disconnected` (initial) → "Connecting..." spinner
   - Agent starts connecting but never reaches interactive state → **"Couldn't Connect"** retry screen
   - Agent reaches `listening`/`thinking`/`speaking` → **Active session UI** (status bar, visualizer, transcript, controls)
   - Agent finishes with errors → **Error display** with retry
   - Agent finishes cleanly after interaction → **Session Complete** with transcript export
5. **Post-session** → Optional per-agent data fetch from Supabase

## Key LiveKit Integrations

- **`RoomAudioRenderer`** — Renders all agent audio tracks (in `session-wrapper.tsx`)
- **`useAgent`** — Agent state, attributes, microphone/camera tracks
- **`useSessionMessages`** — Real-time transcript (agent + user transcriptions)
- **`useChat`** — Chat message send/receive with message history display
- **`useConnectionQualityIndicator`** — Connection quality (Excellent/Good/Poor/Lost) in status bar
- **`useConnectionState`** — Room connection state (shown when not connected)
- **`useTrackToggle`** — Microphone mute/unmute
- **`useStartAudio`** — Browser autoplay handling

## Getting Started

### Prerequisites

- Node.js 18+
- LiveKit Cloud account (or self-hosted LiveKit server)
- Supabase project (for session data persistence)

### Environment Variables

```bash
# LiveKit credentials (per agent)
LIVEKIT_API_KEY_MINKA=
LIVEKIT_API_SECRET_MINKA=
LIVEKIT_URL_MINKA=

LIVEKIT_API_KEY_COACHING=
LIVEKIT_API_SECRET_COACHING=
LIVEKIT_URL_COACHING=

LIVEKIT_API_KEY_LOVEBIRDS=
LIVEKIT_API_SECRET_LOVEBIRDS=
LIVEKIT_URL_LOVEBIRDS=

# Agent passwords
AGENT_PASSWORD_MINKA=
AGENT_PASSWORD_COACHING=
AGENT_PASSWORD_LOVEBIRDS=

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

## Deployment

Deploy on [Vercel](https://vercel.com) — set all environment variables in the Vercel dashboard. Vercel Speed Insights is included automatically.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **LiveKit Client SDK** + **LiveKit React Components** — real-time voice/video
- **Supabase** — session data persistence
- **Tailwind CSS 4** — styling
- **Lucide React** — icons
- **Vercel Speed Insights** — web vitals monitoring
