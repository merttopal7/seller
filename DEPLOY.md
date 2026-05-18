# Production Deployment Guide

Stack: **Next.js** (frontend) · **Express + Prisma** (backend) · **SQLite** (database) · **Elasticsearch** (search) · **Nginx** (reverse proxy) · **Docker Compose**

---

## Prerequisites

| Requirement | Version |
|---|---|
| Docker Engine | 24+ |
| Docker Compose | v2 (built-in `docker compose`) |
| RAM | 2 GB minimum (4 GB recommended) |
| Disk | 20 GB+ free |

Install Docker on Ubuntu/Debian:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # re-login after this
```

---

## 1. Upload the Project

Copy the project to the server (adjust paths):
```bash
scp -r ./Burkina user@your-server:/home/user/app
# or clone from git:
git clone <your-repo-url> /home/user/app
cd /home/user/app
```

---

## 2. Configure Environment Variables

```bash
cp .env.production.example .env.production
nano .env.production
```

Fill in every value:

| Variable | Description |
|---|---|
| `JWT_SECRET` | Random 64-char string — `openssl rand -base64 48` |
| `NEXTAUTH_SECRET` | Another random 64-char string |
| `NEXT_PUBLIC_APP_URL` | Your domain, e.g. `https://example.com` |
| `NEXTAUTH_URL` | Same as above |
| `NEXT_PUBLIC_BACKEND_URL` | Same as above (nginx routes `/api` and `/socket.io` to backend) |
| `NEXT_PUBLIC_APP_NAME` | Site name shown in the UI |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary account (for image uploads) |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

> Variables `ELASTICSEARCH_URL`, `DATABASE_URL`, and `BACKEND_API_URL` are injected automatically by docker-compose — do not add them to `.env.production`.

---

## 3. Configure Nginx Domain

Open `nginx.conf` and replace every occurrence of `yourdomain.com` with your actual domain.

---

## 4. First Build & Start

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

> **Important:** `--env-file .env.production` is required so Docker Compose can resolve `${NEXT_PUBLIC_*}` build arguments at image build time. Without it, those variables arrive empty and the frontend falls back to `localhost:5000`.

This will:
1. Build the backend image (TypeScript → JS)
2. Build the frontend image (Next.js standalone)
3. Pull Elasticsearch and Nginx
4. Start all services
5. On startup the backend automatically re-indexes all ads into Elasticsearch

Watch logs during first boot:
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f backend
```

Expected output when ready:
```
🚀 Classified Ads Backend is running at http://localhost:5000
✅ Elasticsearch ready (N ads indexed)
```

---

## 5. Database Setup

The SQLite database is created automatically on first run. If you need to apply Prisma migrations or seed data, exec into the backend container:

```bash
# Run migrations (if you use migrate instead of db push)
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Seed initial data (optional)
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend npx prisma db seed
```

---

## 6. Verify Everything Is Running

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

All four services should show `Up` / `healthy`:
```
classified-es        Up (healthy)
classified-backend   Up
classified-frontend  Up
classified-nginx     Up
```

Test the endpoints:
```bash
curl http://your-server-ip/api/ads          # should return JSON
curl http://your-server-ip                  # should return HTML
```

---

## 7. Enable HTTPS with Let's Encrypt

### 7.1 Install Certbot

```bash
sudo apt install certbot
```

### 7.2 Obtain Certificate (HTTP challenge via nginx)

Make sure port 80 is open and the domain points to your server IP.

```bash
sudo certbot certonly --webroot \
  -w /var/lib/docker/volumes/app_certbot_www/_data \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email you@example.com --agree-tos --non-interactive
```

### 7.3 Enable HTTPS in nginx.conf

1. Uncomment the `server { listen 443 ssl; ... }` block in `nginx.conf`
2. Replace `yourdomain.com` with your actual domain
3. In the HTTP `server` block, replace `include /etc/nginx/conf.d/proxy.conf;` with `return 301 https://$host$request_uri;`

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml restart nginx
```

### 7.4 Auto-Renew

```bash
sudo crontab -e
# Add this line:
0 3 * * * certbot renew --quiet && docker compose -f /home/user/app/docker-compose.prod.yml restart nginx
```

---

## 8. Useful Commands

### Logs
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f             # all services
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f backend     # backend only
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f frontend    # frontend only
```

### Restart a service
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml restart backend
```

### Stop / Start
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml down      # stop (volumes preserved)
docker compose --env-file .env.production -f docker-compose.prod.yml up -d     # start again
```

### Rebuild after code changes
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build backend    # rebuild backend only
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build frontend   # rebuild frontend only
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build            # rebuild everything
```

### Re-index Elasticsearch
```bash
curl -X POST http://localhost/api/admin/reindex \
  -H "Authorization: Bearer <admin-token>"
```

Or from within the server (bypasses nginx):
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend \
  node -e "import('./dist/lib/search-service.js').then(m => m.reindexAll().then(n => console.log('indexed', n)))"
```

### Database backup
```bash
# Copy the SQLite file out of the volume
docker run --rm \
  -v app_db_data:/data \
  -v $(pwd)/backups:/backup \
  alpine cp /data/prod.db /backup/prod-$(date +%Y%m%d).db
```

### Open a shell inside a container
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend sh
docker compose --env-file .env.production -f docker-compose.prod.yml exec frontend sh
```

---

## 9. Environment Variables Reference

### Backend (from `.env.production`)
| Variable | Required | Default in compose |
|---|---|---|
| `JWT_SECRET` | Yes | — |
| `NEXTAUTH_SECRET` | Yes | — |
| `DATABASE_URL` | — | `file:/app/data/prod.db` |
| `ELASTICSEARCH_URL` | — | `http://elasticsearch:9200` |

### Frontend (from `.env.production` + build args)
| Variable | Type | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | build arg + runtime | Public site URL |
| `NEXT_PUBLIC_BACKEND_URL` | build arg | Public URL for Socket.IO (same as APP_URL) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | build arg | Cloudinary cloud name |
| `NEXTAUTH_URL` | runtime | Must match public URL |
| `NEXTAUTH_SECRET` | runtime | Same as backend |
| `BACKEND_API_URL` | — | `http://backend:5000` (set by compose) |
| `DATABASE_URL` | — | `file:/app/data/prod.db` (set by compose) |

---

## 10. Architecture Overview

```
Browser
  │
  ▼
Nginx :80/:443
  ├─ /api/*          → backend:5000
  ├─ /uploads/*      → backend:5000
  ├─ /socket.io/*    → backend:5000  (WebSocket)
  └─ /*              → frontend:3000

frontend:3000 (Next.js)
  └─ SSR API calls → BACKEND_API_URL=http://backend:5000 (internal)

backend:5000 (Express)
  ├─ SQLite   → /app/data/prod.db  (volume: db_data)
  ├─ Uploads  → /app/uploads/       (volume: uploads_data)
  └─ ES       → elasticsearch:9200 (internal)

elasticsearch:9200 → volume: esdata
```

---

## 11. Troubleshooting

### Backend won't start — "Elasticsearch not available"
Elasticsearch takes ~30 seconds to become healthy. The backend will print a warning and start anyway using the Prisma fallback. Wait for ES to be ready, then the next request will use ES automatically.

### "Cannot find module" in backend
The TypeScript build failed. Check:
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs backend | head -50
```

### Next.js build fails
`NEXT_PUBLIC_*` vars are baked in at build time. Make sure they are set in `.env.production` **before** running `--build`.

### SQLite locked / database is locked
Both the frontend and backend mount the same `db_data` volume. SQLite WAL mode handles concurrent reads. If you see lock errors under heavy write load, consider upgrading to PostgreSQL or Turso (LibSQL cloud).

### Port 80 already in use
```bash
sudo lsof -i :80    # find the process
sudo systemctl stop apache2   # example
```
