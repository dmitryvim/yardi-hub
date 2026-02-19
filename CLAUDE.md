# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Yardi Hub — a Next.js 16 hub service for `yardi.dmitrylabs.com`. Provides Telegram authentication (Auth.js v5), user profiles, and a game registry. Games (like Ducks & Geese) are separate services; the hub serves as the central landing page and auth gateway.

## Commands

```bash
npm run dev      # Next.js dev server on :3000
npm run build    # Production build (standalone output)
npm run lint     # ESLint (v9 flat config)
```

### Database

```bash
docker compose -f docker-compose.dev.yml up -d   # Postgres on :5433
DATABASE_URL=postgresql://yardi:yardi@localhost:5433/yardi npx drizzle-kit push   # Apply schema
DATABASE_URL=postgresql://yardi:yardi@localhost:5433/yardi npx drizzle-kit studio  # Browse data
```

### Docker (docker compose v2)

```bash
docker compose build hub         # Build hub image
docker compose up -d             # Traefik + Postgres + Hub (production)
```

## Architecture

### Authentication flow

`TelegramLoginButton` (client widget) → `signIn("telegram")` → Auth.js Credentials provider (`auth.ts`) → `verifyTelegramHash()` (`lib/telegram.ts`, HMAC-SHA256 via Web Crypto API, 24h expiry) → JWT session with Telegram profile fields → upsert user in DB.

All pages require login. Only `/login` and `/api/auth/*` are public (enforced by middleware).

### Database

PostgreSQL + Drizzle ORM. Two tables:
- `users` — Telegram users (telegramId, username, firstName, lastName, photoUrl)
- `games` — Game registry (key, name, description, tags, basePath, enabled)

Schema at `lib/db/schema.ts`. Drizzle Kit does NOT auto-load `.env.local`; pass `DATABASE_URL` env var explicitly.

### Key files

| File | Purpose |
|------|---------|
| `auth.ts` | Auth.js v5 config — Telegram credentials provider, JWT callbacks, user upsert |
| `middleware.ts` | Redirects unauthenticated users to `/login` (all routes protected) |
| `lib/telegram.ts` | `verifyTelegramHash()` — Web Crypto API (edge-compatible, no Node.js crypto) |
| `lib/db/schema.ts` | Drizzle schema: users + games tables |
| `lib/db/index.ts` | Drizzle client (postgres.js driver) |
| `config/games.ts` | Static game registry (GameConfig array) |
| `types/next-auth.d.ts` | Extended session/JWT types with telegramId, username, photoUrl |
| `types/game.d.ts` | GameConfig interface |
| `app/components/TelegramLoginButton.tsx` | Telegram Login Widget (script injection, signIn callback) |
| `app/components/Navbar.tsx` | Navigation bar with session-aware links |
| `app/providers.tsx` | Client-side SessionProvider wrapper |
| `drizzle.config.ts` | Drizzle Kit config (requires DATABASE_URL env var) |

### Stack

- **Next.js 16** with App Router, standalone output for Docker
- **Auth.js v5** (beta) with JWT sessions (stateless, no DB sessions)
- **Drizzle ORM** + **postgres.js** driver
- **React 19**, TailwindCSS 4, TypeScript 5
- **Deployment**: multi-stage Dockerfile (node:22-alpine) + Traefik v3.6 + Let's Encrypt HTTPS

### Environment variables

- `AUTH_SECRET` / `AUTH_TRUST_HOST` / `AUTH_URL` — Auth.js config
- `TELEGRAM_BOT_TOKEN` — server-side only, HMAC verification
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` — public, Telegram Login Widget
- `DATABASE_URL` — PostgreSQL connection string

### Important notes

- `lib/telegram.ts` uses Web Crypto API (not Node.js `crypto`) — required for edge runtime compatibility (middleware runs in edge)
- DB imports in `auth.ts` are dynamic (`await import()`) to avoid loading postgres.js driver in edge runtime
- Two Telegram bots: `yardi_local_bot` (local dev, domain `yardi.local.dmitrylabs.com`) and production bot (domain `yardi.dmitrylabs.com`)
- Dev Postgres runs on port **5433** (5432 is taken by other services)

### Path alias

`@/*` maps to project root (tsconfig).

## Local dev setup

Requires `/etc/hosts` entry `127.0.0.1 yardi.local.dmitrylabs.com`, local nginx with mkcert SSL certs proxying to `localhost:3000`, and a Telegram bot with domain set to `yardi.local.dmitrylabs.com`. See README.md for full steps.
