# Patrona

**Your AI voice companion for getting home safe at night.**

Patrona is a real-time safety app that walks with you through voice conversation, monitors your well-being through silence detection, and silently alerts your emergency contacts if something goes wrong.

## How It Works

1. **Start a walk** — Tap "Walk Me Home" and Patrona starts talking to you like a friend on the phone
2. **Voice companion** — Patrona keeps you company with natural conversation powered by ElevenLabs Conversational AI
3. **Silent monitoring** — If you stop responding, Patrona escalates through gentle check-ins before alerting your contacts
4. **Safe word** — Say your secret safe word naturally in conversation and Patrona silently alerts your contacts without any indication to anyone nearby
5. **Emergency SMS** — Your contacts receive your live GPS location via SMS so they can find you or call for help

## Safety System

Patrona uses a multi-tier escalation system:

| Tier | Trigger | Action |
|------|---------|--------|
| 1 | 90 seconds of silence | Gentle check-in: "Hey, you still there?" |
| 2 | 20 more seconds | Firmer check-in: "I need to hear from you" |
| 3 | 30 more seconds | Emergency SMS sent to all contacts with live location |
| Safe word | Detected in speech | Immediate silent alert — Patrona keeps talking normally |

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Voice AI:** ElevenLabs Conversational AI (WebRTC)
- **SMS Alerts:** Twilio
- **Maps:** Google Maps JavaScript API
- **Database:** Supabase (location tracking)
- **Deployment:** Vercel (frontend + serverless functions)

## Project Structure

```
patrona/
├── src/
│   ├── components/
│   │   ├── HomeScreen.jsx        # Main dashboard
│   │   ├── WalkScreen.jsx        # Active walk with voice + GPS
│   │   ├── AlertScreen.jsx       # Emergency alert confirmation
│   │   ├── ArrivedScreen.jsx     # Walk completion
│   │   ├── TrackingPage.jsx      # Public tracking page for contacts
│   │   ├── Onboarding.jsx        # First-time user setup
│   │   ├── SettingsScreen.jsx    # Profile & contacts management
│   │   ├── HistoryScreen.jsx     # Past walks log
│   │   └── BottomNav.jsx         # Tab navigation
│   ├── hooks/
│   │   ├── useVoiceSession.js    # ElevenLabs voice agent
│   │   ├── useSafetyMonitor.js   # Silence detection & escalation
│   │   └── useGPS.js             # Geolocation tracking
│   ├── utils/
│   │   ├── alerts.js             # API calls for SMS alerts
│   │   ├── maps.js               # Google Maps integration
│   │   └── storage.js            # localStorage persistence
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                 # Design system & theming
├── api/                          # Vercel serverless functions
│   ├── alert.js                  # Send emergency SMS
│   ├── alert-clear.js            # Send all-clear SMS
│   ├── ping.js                   # Store location to Supabase
│   ├── health.js                 # Health check endpoint
│   ├── location/
│   │   └── [sessionId].js        # Fetch session location
│   └── _lib/
│       └── supabase.js           # Shared Supabase client
├── server/                       # Express server (local dev)
│   └── index.js
├── vercel.json
├── supabase-schema.sql
└── .env.example
```

## Setup

### Prerequisites

You need accounts on:
- [ElevenLabs](https://elevenlabs.io) — Conversational AI agent
- [Twilio](https://www.twilio.com) — SMS messaging (toll-free number recommended)
- [Google Cloud](https://console.cloud.google.com) — Maps JavaScript API, Directions API, Geocoding API
- [Supabase](https://supabase.com) — Database for location tracking

### 1. Clone and install

```bash
git clone https://github.com/ketakiii3/patrona.git
cd patrona
npm install
```

### 2. Set up Supabase

Create a new Supabase project, then run the SQL in `supabase-schema.sql` in the SQL Editor.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in your API keys:

```
VITE_ELEVENLABS_AGENT_ID=your_agent_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_API_URL=

TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

FRONTEND_URL=http://localhost:5173
```

### 4. Run locally

```bash
# Terminal 1 — Backend
cd server
cp ../.env .env
npm install
npm start

# Terminal 2 — Frontend
npm run dev
```

Open `http://localhost:5173`

## Deploy on Vercel

1. Push to GitHub
2. Import repo on [Vercel](https://vercel.com)
3. Framework: **Vite** | Build: `npm run build` | Output: `dist`
4. Add all environment variables from `.env.example` in Vercel Settings
5. Set `FRONTEND_URL` to your deployed URL
6. Deploy

## Key Features

- **Voice-first design** — No screen interaction needed during walks. Everything works through voice.
- **Safe word detection** — Completely silent. Patrona continues talking normally so no one nearby knows help was called.
- **Multi-tier escalation** — Progressive check-ins before alerting, reducing false alarms.
- **Real-time GPS tracking** — Emergency contacts get a live location link via SMS.
- **Dark/light theme** — Minimalist design optimized for nighttime use.
- **Walk history** — Log of all past walks with safety status.
- **Works on mobile browsers** — No app store download needed. PWA-ready.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/alert` | Send emergency SMS to all contacts |
| POST | `/api/alert/clear` | Send all-clear SMS |
| POST | `/api/ping` | Store location ping to Supabase |
| GET | `/api/location/:sessionId` | Get latest location for a session |
| GET | `/api/health` | Health check |

## License

MIT
