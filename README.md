# Yardi Hub

Hub service for `yardi.dmitrylabs.com`. Telegram auth, game registry, user profiles.

## Prerequisites

### 1. `/etc/hosts`

```
127.0.0.1 yardi.local.dmitrylabs.com
```

### 2. SSL certificates (mkcert)

```bash
brew install mkcert
mkcert -install
mkdir -p /opt/homebrew/etc/nginx/certs
mkcert -cert-file /opt/homebrew/etc/nginx/certs/yardi.local.dmitrylabs.com.pem -key-file /opt/homebrew/etc/nginx/certs/yardi.local.dmitrylabs.com-key.pem yardi.local.dmitrylabs.com
```

### 3. nginx

Config at `/opt/homebrew/etc/nginx/servers/yardi.local.dmitrylabs.com.conf`:

```nginx
server {
    listen 80;
    server_name yardi.local.dmitrylabs.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yardi.local.dmitrylabs.com;

    ssl_certificate     /opt/homebrew/etc/nginx/certs/yardi.local.dmitrylabs.com.pem;
    ssl_certificate_key /opt/homebrew/etc/nginx/certs/yardi.local.dmitrylabs.com-key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Start / restart nginx:

```bash
sudo brew services restart nginx
```

### 4. Telegram bots

Two bots are needed (Telegram Login Widget allows one domain per bot):

| Bot | Domain | Purpose |
|-----|--------|---------|
| `yardi_local_bot` | `yardi.local.dmitrylabs.com` | Local development |
| `yardi_hub_bot` | `yardi.dmitrylabs.com` | Production |

Create each via [@BotFather](https://t.me/BotFather), then `/mybots` → select bot → **Bot Settings** → **Domain** → set the domain.

### 5. Environment variables

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` |
| `AUTH_URL` | `https://yardi.local.dmitrylabs.com` |
| `TELEGRAM_BOT_TOKEN` | From @BotFather (local bot) |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Bot username without `@` |
| `DATABASE_URL` | `postgresql://yardi:yardi@localhost:5433/yardi` |

## Development

```bash
docker compose -f docker-compose.dev.yml up -d   # start postgres on :5433
DATABASE_URL=postgresql://yardi:yardi@localhost:5433/yardi npx drizzle-kit push   # create/update tables
npm run dev                                       # start Next.js on :3000
```

Open https://yardi.local.dmitrylabs.com — nginx proxies to `localhost:3000`.

## Production (Docker)

```bash
docker compose build hub
docker compose up -d   # Traefik + Postgres + Hub on yardi.dmitrylabs.com
```

## Project Structure

```
auth.ts                          # Auth.js v5 config — Telegram credentials provider
middleware.ts                    # Route protection (all pages require login)
lib/telegram.ts                  # Telegram hash verification (Web Crypto API)
lib/db/schema.ts                 # Drizzle schema (users, games tables)
lib/db/index.ts                  # Drizzle client
config/games.ts                  # Game registry
app/layout.tsx                   # Root layout with Navbar + SessionProvider
app/page.tsx                     # Landing page
app/login/page.tsx               # Telegram login page
app/profile/page.tsx             # User profile (protected)
app/games/page.tsx               # Games listing
app/components/Navbar.tsx        # Navigation bar
app/components/TelegramLoginButton.tsx  # Telegram widget
docker-compose.yml               # Production: Traefik + Postgres + Hub
docker-compose.dev.yml           # Dev: Postgres on :5433
Dockerfile                       # Multi-stage Next.js standalone build
```
