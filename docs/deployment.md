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

```bash
# Hub
cd ~/Projects/yardi/yardi-hub
docker build -t ghcr.io/dmitryvim/yardi-hub:latest .
docker push ghcr.io/dmitryvim/yardi-hub:latest

# Tanki
cd ~/Projects/yardi/tanki2
docker build -t ghcr.io/dmitryvim/yardi-tanki2:latest .
docker push ghcr.io/dmitryvim/yardi-tanki2:latest
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

This starts 4 services:

| Service | Description |
|---------|-------------|
| **traefik** | Reverse proxy, automatic HTTPS via Let's Encrypt |
| **postgres** | PostgreSQL 17 database |
| **hub** | Yardi Hub at `yardi.dmitrylabs.com` |
| **tanki2** | Tanki 2 game at `yardi.dmitrylabs.com/g/tanki2` |

### 6. Apply database schema (first time)

From your local machine, open an SSH tunnel and run drizzle-kit:

```bash
# Terminal 1: SSH tunnel
ssh -L 5432:localhost:5432 your-vps

# Terminal 2: push schema
DATABASE_URL=postgresql://yardi:YOUR_PASSWORD@localhost:5432/yardi npx drizzle-kit push
```

### 7. Verify

```bash
docker compose ps              # all services should be "Up"
docker compose logs -f hub     # check hub logs
curl -I https://yardi.dmitrylabs.com
```

## Deploy updates

Build, push, and restart — from your local machine:

```bash
# Example: update hub
cd ~/Projects/yardi/yardi-hub
docker build -t ghcr.io/dmitryvim/yardi-hub:latest . && \
docker push ghcr.io/dmitryvim/yardi-hub:latest && \
ssh your-vps "cd ~/yardi && docker compose pull hub && docker compose up -d hub"
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Let's Encrypt fails | Ensure DNS A record points to VPS, ports 80/443 open |
| 502 Bad Gateway | `docker compose logs hub` — check env vars and DB connection |
| Telegram login fails | Verify bot domain is `yardi.dmitrylabs.com` in @BotFather |
| DB connection refused | `docker compose ps postgres` — wait for healthcheck to pass |
