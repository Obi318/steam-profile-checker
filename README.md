# Steam Profile Checker (V1.1)

Paste a Steam profile URL / vanity name / SteamID64 and get a neutral **Trust Score** based on public Steam signals (account age, profile transparency, Steam level, ban indicators, and optional game hours).

> Not a cheat detector. No accusations — just context.

## Quick start

1) Install deps

```bash
npm install
```

2) Create `.env.local` (do **not** commit it)

```bash
cp .env.local.example .env.local
```

Put your Steam Web API key in `.env.local`:

```
STEAM_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://steamchecker.io
```

3) Run

```bash
npm run dev
```

Open http://localhost:3000

## Project notes

- App Router: `app/`
- API route: `app/api/check/route.js`
- UI: `app/page.js`
