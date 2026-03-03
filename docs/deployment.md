# Cloud Deployment

Deploy Yardi Hub + games to a VPS using pre-built Docker images from GitHub Container Registry (GHCR).

## DNS setup

Create an A record pointing to your VPS:

```
yardi.dmitrylabs.com  →  <VPS_IP>
```

Traefik handles HTTPS automatically via Let's Encrypt. Ports **80** and **443** must be open on the VPS.

## Push Docker images

### 1. Authenticate with GHCR

Create a [Personal Access Token](https://github.com/settings/tokens) with `write:packages` scope, then:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u dmitryvim --password-stdin
```

### 2. Build and push

Each project has a `deploy.sh` that builds, pushes, and deploys:

```bash
# Hub (also builds migrate image)
cd ~/Projects/yardi/yardi-hub
./deploy.sh

# Games
cd ~/Projects/yardi/tanki2
./deploy.sh

cd ~/Projects/yardi/ducks-and-geese
./deploy.sh
```

### 3. Make packages public (first time only)

Go to https://github.com/dmitryvim?tab=packages → each package → **Package settings** → **Change visibility** → **Public**.

## Run on the server

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
```

### 2. Create project directory

```bash
mkdir -p ~/yardi && cd ~/yardi
```

### 3. Download `docker-compose.yml`

```bash
curl -O https://raw.githubusercontent.com/dmitryvim/yardi-hub/main/docker-compose.yml
```

### 4. Create `.env`

```bash
nano .env
```

Required variables:

| Variable | How to get |
|----------|------------|
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `TELEGRAM_BOT_TOKEN` | Production bot from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_BOT_USERNAME` | Bot username without `@` |
| `POSTGRES_USER` | `yardi` |
| `POSTGRES_PASSWORD` | `openssl rand -base64 24` |
| `LETSENCRYPT_EMAIL` | Your email for Let's Encrypt certificates |

### 5. Start

```bash
docker compose pull
docker compose up -d
```

The `migrate` service runs `drizzle-kit push` automatically before the hub starts. No need to apply schema manually.

Services:

| Service | Description |
|---------|-------------|
| **traefik** | Reverse proxy, automatic HTTPS via Let's Encrypt |
| **postgres** | PostgreSQL 17 database |
| **migrate** | Runs DB migrations, exits after completion |
| **hub** | Yardi Hub at `yardi.dmitrylabs.com` |
| **tanki2** | Tanki 2 game at `yardi.dmitrylabs.com/g/tanki2` |
| **dng** | Ducks & Geese at `yardi.dmitrylabs.com/g/ducks-and-geese` |

### 6. Verify

```bash
docker compose ps              # all services should be "Up" (migrate should be "Exited (0)")
docker compose logs -f hub     # check hub logs
curl -I https://yardi.dmitrylabs.com
```

## Deploy updates

Use `deploy.sh` from the relevant project directory. It builds, pushes, copies docker-compose.yml, and restarts services.

```bash
# Update hub
cd ~/Projects/yardi/yardi-hub && ./deploy.sh

# Update a game (push image, then restart on server)
cd ~/Projects/yardi/tanki2 && ./deploy.sh
ssh ubuntu@yardi.dmitrylabs.com "cd ~/yardi && docker compose pull tanki2 && docker compose up -d --force-recreate tanki2"
```

All images use `pull_policy: always` in docker-compose.yml, so `docker compose up -d` will pull the latest images.

## Environment variables (hub)

| Variable | Where | Purpose |
|----------|-------|---------|
| `AUTH_SECRET` | Server-side | Auth.js JWT encryption key |
| `AUTH_TRUST_HOST` | Server-side | Set to `"true"` behind reverse proxy |
| `AUTH_URL` | Server-side | Public URL (e.g., `https://yardi.dmitrylabs.com`) |
| `TELEGRAM_BOT_TOKEN` | Server-side only | HMAC verification of Telegram login |
| `TELEGRAM_BOT_USERNAME` | Server-side | Bot username, passed to login page at runtime |
| `DATABASE_URL` | Server-side | PostgreSQL connection string |

**Important**: `TELEGRAM_BOT_USERNAME` is read at runtime by the server-rendered login page (not via `NEXT_PUBLIC_*`). This avoids the need to bake it in at Docker build time.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Let's Encrypt fails | Ensure DNS A record points to VPS, ports 80/443 open |
| 502 Bad Gateway | `docker compose logs hub` — check env vars and DB connection |
| Telegram login button missing | Check `TELEGRAM_BOT_USERNAME` is set in `.env` |
| `Configuration` error after login | Check `docker compose logs hub` — likely DB tables missing (migrate service failed) |
| Game returns 404 | Check game uses `standalone-config.ts` preload (see [adding-a-game.md](adding-a-game.md)) |
| Telegram login fails | Verify bot domain is `yardi.dmitrylabs.com` in @BotFather |
| DB connection refused | `docker compose ps postgres` — wait for healthcheck to pass |
| Container not updating | Use `docker compose up -d --force-recreate <service>` |
