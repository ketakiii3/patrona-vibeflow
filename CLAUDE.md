# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend
```bash
npm run dev       # Start Vite dev server on localhost:5173
npm run build     # Build optimized bundle to dist/
npm run preview   # Preview production build locally
```

### Backend (local development)
```bash
cd server && npm install   # First-time setup
cd server && npm start     # Run Express server on port 3001
cd server && npm run dev   # Run with file watching
```

The Vite dev server proxies `/api/*` requests to `localhost:3001`, so both must run simultaneously for full local development.

## Architecture

Patrona is a voice-driven safety companion PWA. The user starts a walk, an AI voice (ElevenLabs) keeps them company, and the app silently escalates to SMS alerts if the user goes quiet for too long or says a safe word.

### Frontend (`src/`)

**App.jsx** is the central router — it manages a `screen` state (`idle | walking | alert | arrived`) and a `tab` state (`home | history | settings`). The WalkScreen intentionally stays mounted during the `alert` state to keep the voice session alive.

Key custom hooks:
- **`useVoiceSession`** — initializes ElevenLabs WebRTC conversation, tracks speaking state and user messages
- **`useSafetyMonitor`** — runs a 5s polling loop implementing three-tier silence escalation:
  1. 90s of silence → gentle check-in via voice
  2. 20s more → firmer check-in
  3. 30s more → triggers emergency SMS (calls `sendAlert` in `utils/alerts.js`)
  - Safe word detection triggers an alert silently without interrupting the voice conversation
- **`useGPS`** — polls geolocation during walks, pings `/api/ping` to store coordinates in Supabase

**`utils/storage.js`** — all user profile data (name, safe word, emergency contacts) is persisted in localStorage.

**`TrackingPage.jsx`** — a public-facing page (loaded when URL contains `/track` or `?tracking`) that polls `/api/location/:sessionId` to display a live Google Maps view for emergency contacts.

### Backend

**Local dev:** `server/index.js` (Express)
**Production:** `api/` (Vercel serverless functions)

Both implement the same four endpoints:
- `POST /api/alert` — sends emergency SMS to all contacts via Twilio with a Supabase tracking link
- `POST /api/alert/clear` — sends all-clear SMS
- `POST /api/ping` — upserts a location ping to the `location_pings` Supabase table
- `GET /api/location/:sessionId` — returns the latest location ping for the tracking page

`api/_lib/supabase.js` is shared across Vercel functions for the Supabase client.

### Database (Supabase)

Schema in `supabase-schema.sql`. Three tables: `users`, `emergency_contacts`, `location_pings`. Row-level security is enabled with public read on `location_pings` so emergency contacts can view live tracking without auth.

## Environment Variables

Copy `.env.example` to `.env` for local frontend config. Copy `.env` to `server/.env` for the local Express server.

| Variable | Purpose |
|---|---|
| `VITE_ELEVENLABS_AGENT_ID` | ElevenLabs conversational AI agent |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps on the tracking page |
| `VITE_API_URL` | Backend base URL (blank for local proxy) |
| `VITE_API_SECRET` / `PATRONA_API_SECRET` | Shared secret for API auth — must match on both sides. Generate with `openssl rand -hex 32`. Leave unset in local dev. |
| `TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER` | SMS sending |
| `SUPABASE_URL/SERVICE_KEY` | Database access |
| `FRONTEND_URL` | Base URL used in SMS tracking links |

## Deployment

Deployed on Vercel. The `vercel.json` rewrites handle routing:
- `/api/alert/clear` → `api/alert-clear.js` (Vercel filenames can't contain `/`)
- `/api/location/:sessionId` → `api/location/[sessionId].js`
- All other paths fall back to `index.html` for SPA routing
