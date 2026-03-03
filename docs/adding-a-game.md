# Adding a Game to Yardi Hub

This guide explains how to integrate a new game into the Yardi Hub platform.

## Overview

Games are standalone services (their own Docker container) that run behind Traefik under a path prefix like `/g/<key>`. The hub provides authentication, the game registry, and a shared user session via JWT cookie.

## Step-by-step

### 1. Choose a game key

Pick a short, unique key for your game (e.g., `dng`, `chess`, `pong`). This key is used everywhere: URL path, Docker service name, config entry.

### 2. Register in the hub

Add your game to `config/games.ts`:

```typescript
{
  key: "mygame",
  name: "My Game",
  description: "A short description of the game.",
  icon: "/games/mygame.svg",
  color: "#3498db",        // brand color (hex)
  multiplayer: false,
  tags: ["puzzle", "solo"],
  basePath: "/g/mygame",
}
```

Place the icon file in `public/games/mygame.svg` (or `.png`).

### 3. Build your game

Your game is a standalone web app. Requirements:

- **Framework**: Any (Next.js, plain HTML, Phaser, etc.)
- **Port**: Expose an HTTP port (e.g., 3000)
- **Base path**: Your app must serve all assets and routes under `/g/<key>/`. For Next.js, set `basePath: "/g/mygame"` in `next.config.ts`.
- **Dockerfile**: Provide a Dockerfile for production builds

### 4. Read the user session

The hub sets a JWT cookie (`authjs.session-token`) with `Path=/` and `SameSite=lax`. Since your game runs under the same domain (`yardi.dmitrylabs.com`), the cookie is sent automatically.

To read the session in your game:

**Option A: Call the hub's session API**

```typescript
const res = await fetch("/api/auth/session", { credentials: "include" });
const session = await res.json();
// session.user.telegramId, session.user.firstName, etc.
```

**Option B: Decrypt the JWT directly**

Use the `jose` library to decrypt the JWE token from the cookie. The encryption key is derived from `AUTH_SECRET` via HKDF (this is Auth.js's internal format):

```typescript
import { jwtDecrypt } from "jose";
import { hkdf } from "@panva/hkdf";

const secret = process.env.AUTH_SECRET;
const encryptionKey = await hkdf("sha256", secret, "", "Auth.js Generated Encryption Key", 32);
const { payload } = await jwtDecrypt(cookieValue, encryptionKey);
// payload.telegramId, payload.firstName, etc.
```

This approach works server-side (e.g., during WebSocket upgrade) and doesn't require an HTTP roundtrip.

### 5. Create a Dockerfile

Provide a Dockerfile for production builds. Example for a Next.js game:

```dockerfile
FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

### 6. Build and push the Docker image

Images are hosted on GitHub Container Registry (GHCR).

```bash
# Authenticate (once)
echo $GITHUB_TOKEN | docker login ghcr.io -u dmitryvim --password-stdin

# Build and push
cd /path/to/mygame
docker build -t ghcr.io/dmitryvim/yardi-mygame:latest .
docker push ghcr.io/dmitryvim/yardi-mygame:latest
```

Make the package public: https://github.com/dmitryvim?tab=packages → your package → **Package settings** → **Change visibility** → **Public**.

### 7. Add to docker-compose.yml

Add your game as a service in the hub's `docker-compose.yml`:

```yaml
  mygame:
    image: ghcr.io/dmitryvim/yardi-mygame:latest
    restart: always
    environment:
      AUTH_SECRET: ${AUTH_SECRET}   # same secret as hub
    networks:
      - yardi
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.mygame.rule=Host(`yardi.dmitrylabs.com`) && PathPrefix(`/g/mygame`)"
      - "traefik.http.routers.mygame.entrypoints=websecure"
      - "traefik.http.routers.mygame.tls.certresolver=le"
      - "traefik.http.services.mygame.loadbalancer.server.port=3000"
```

Traefik routes `/g/mygame/*` to your container; everything else goes to the hub.

### 8. Deploy to server

On the VPS:

```bash
cd ~/yardi
docker compose pull
docker compose up -d
```

See [deployment.md](deployment.md) for full server setup instructions.

### 9. Local development

For local dev, run your game standalone on its own port and use nginx to route:

```nginx
# Add to /opt/homebrew/etc/nginx/servers/yardi.local.dmitrylabs.com.conf
location /g/mygame {
    proxy_pass http://127.0.0.1:3002;  # your game's dev port
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

The hub runs on `:3000`, your game on another port (e.g., `:3002`). Both share the same domain and cookie.

## Session fields

The JWT token / session object contains:

| Field | Type | Description |
|-------|------|-------------|
| `sub` | string | Telegram user ID (same as telegramId) |
| `telegramId` | string | Telegram user ID |
| `firstName` | string | User's first name |
| `lastName` | string? | User's last name |
| `username` | string? | Telegram username |
| `photoUrl` | string? | Telegram avatar URL |

## Checklist

- [ ] Game key chosen and unique
- [ ] Entry added to `config/games.ts`
- [ ] Icon placed in `public/games/`
- [ ] Game serves under `/g/<key>/` base path
- [ ] Session reading works (API call or JWT decryption)
- [ ] Dockerfile created
- [ ] Docker image built and pushed to GHCR
- [ ] Service added to `docker-compose.yml` with Traefik labels
- [ ] Deployed to server (`docker compose pull && docker compose up -d`)
- [ ] Local nginx rule added for dev
