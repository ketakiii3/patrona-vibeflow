<p align="center">
  <img src="public/logo.png" alt="Patrona" width="200" />
</p>

# Patrona

**Your AI voice companion for getting home safe at night.**

Patrona is a real-time safety app that walks with you through voice conversation, monitors your well-being through silence detection, and silently alerts your emergency contacts if something goes wrong.

## How It Works

1. **Start a walk** — Tap "Walk Me Home" and Patrona starts talking to you like a friend on the phone
2. **Voice companion** — Patrona keeps you company with natural conversation powered by ElevenLabs Conversational AI
3. **Silent monitoring** — If you stop responding, Patrona escalates through gentle check-ins before alerting your contacts
4. **Safe word** — Say your secret safe word naturally in conversation and Patrona silently alerts your contacts without any indication to anyone nearby
5. **Emergency SMS** — Your contacts receive your location via SMS so they can find you or call for help

## Safety System

Patrona uses a multi-tier escalation system:

| Tier | Trigger | Action |
|------|---------|--------|
| 1 | 90 seconds of silence | Gentle check-in: "Hey, you still there?" |
| 2 | 20 more seconds | Firmer check-in: "I need to hear from you" |
| 3 | 30 more seconds | Emergency SMS sent to all contacts with live location |
| Safe word | Detected in speech | Immediate silent alert — Patrona keeps talking normally |

## Built With

- **React 18 + Vite** — Frontend
- **Convex** — Real-time backend (database, queries, mutations, actions)
- **ElevenLabs Conversational AI** — Voice companion (WebRTC)
- **Textbelt** — SMS alerts
- **Google Maps JavaScript API** — Live location tracking for contacts
- **Clerk** — User authentication
- **VibeFlow** — Visual backend builder

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Set up Convex:
   ```bash
   npx convex dev
   ```
   This will prompt you to create a Convex project and generate a deployment URL.

3. Add the Convex URL to your `.env`:
   ```
   VITE_CONVEX_URL=https://your-project.convex.cloud
   ```

4. Set Convex environment variables for backend services:
   ```bash
   npx convex env set CLERK_SECRET_KEY sk_test_...
   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-clerk-domain.clerk.accounts.dev
   npx convex env set TEXTBELT_KEY your_textbelt_key
   npx convex env set FRONTEND_URL https://your-app.vercel.app
   ```

5. Run the dev server:
   ```bash
   npm run dev
   ```
