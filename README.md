# Professional Restaurant POS System

A high-performance, mobile-optimized, and feature-rich Point of Sale system built with React, Node.js, and PostgreSQL.

## Features
- **PWA Support**: Install as a native app on iOS, Android, and Desktop.
- **Real-time Notifications**: Instant kitchen and waiter alerts via WebSockets and Browser Notifications.
- **Mobile First**: Fully responsive UI for tablets and smartphones.
- **Comprehensive Management**: Staff, Inventory, Tables, Reservations, and Analytics.
- **Dockerized**: Easy deployment with Docker Compose.

## Prerequisites
- Docker and Docker Compose
- Node.js (for local development)

## Getting Started with Docker

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd Restaurant-Pos
   ```

2. Start the application:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - **App**: http://localhost (frontend + API and WebSockets proxied via Nginx)
   - **Login**: admin@restaurant.com / admin123 (after the seed runs on first start)

## Local Development

### 1. Backend (PostgreSQL)

Create a PostgreSQL database that matches the `DATABASE_URL` in `backend/.env` (see `backend/.env.example`). Then:

```bash
cd backend
cp .env.example .env   # then edit .env and set DATABASE_URL, JWT_SECRET
npm install
npx prisma db push     # create tables
npx prisma db seed     # create admin user + sample data (optional)
npm run dev
```

**First-time login:** If you didn’t run the seed, create the first admin with:

```bash
curl -X POST http://localhost:5001/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}'
```

Then log in with **admin@restaurant.com** / **admin123** (or the email/password you used in the request above).

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

## GitHub and CI/CD

### Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Restaurant POS with Docker and CI/CD"
git branch -M main
git remote add origin https://github.com/iamsnh1/Restaurant-Pos.git
git push -u origin main
```

Use a **personal access token** or **SSH** if you have 2FA. Do not commit `.env` files (they are in `.gitignore`).

### CI (lint and build)

On every **push** and **pull request** to `main` or `develop`:

- **Cache:** npm dependency cache (per `package-lock.json`) and Docker layer cache (GitHub Actions cache).
- **Jobs:**
  - Install backend deps, Prisma generate, lint (if script exists), install frontend deps, lint frontend, build frontend with `VITE_API_URL=/api`.
  - Build backend and frontend Docker images (no push) with `cache-from` / `cache-to` for faster runs.

Workflow file: [.github/workflows/ci.yml](.github/workflows/ci.yml).

### CD (build and push Docker images)

On every **push to `main`**:

- **Cache:** Docker layer cache stored in GitHub Actions cache (`type=gha`, `mode=max`) so the next run reuses layers.
- **Actions:** Log in to GitHub Container Registry (GHCR), build backend and frontend images, push to:
  - `ghcr.io/iamsnh1/restaurant-pos-backend:latest` and `:sha`
  - `ghcr.io/iamsnh1/restaurant-pos-frontend:latest` and `:sha`

To run the app from GHCR (after making the package public or logging in):

```bash
# Optional: log in to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u iamsnh1 --password-stdin

# Use images in docker-compose (override build with image)
export BACKEND_IMAGE=ghcr.io/iamsnh1/restaurant-pos-backend:latest
export FRONTEND_IMAGE=ghcr.io/iamsnh1/restaurant-pos-frontend:latest
# Then in compose you’d reference these images instead of building locally.
```

Workflow file: [.github/workflows/cd.yml](.github/workflows/cd.yml).

## Deploy full Docker stack (frontend + backend + DB)

These platforms can run your **entire** app from Docker (all three services: frontend, backend, Postgres) so you don’t split frontend and backend.

| Platform | How it works | Good for |
|----------|----------------|----------|
| **Railway** | One project, 3 services: add **Postgres** from the catalog, then deploy **backend** and **frontend** from their Dockerfiles (or from GHCR images). Each service gets a URL; set frontend’s public URL as `FRONTEND_URL` on the backend. | Easiest “all-in-one” with managed Postgres. |
| **Render** | Use a **Blueprint** (`render.yaml`): define a **Postgres** instance plus **Web Services** for backend and frontend (both built from Dockerfile). Render runs the containers and gives each a URL. | Free tier, good docs. |
| **Fly.io** | Deploy with **fly launch** or a Dockerfile per app. Run Postgres with `fly postgres create` or use a **volume** and your postgres image. Run backend and frontend as separate **apps**; point frontend at the backend URL. | Global regions, Docker-native. |
| **DigitalOcean App Platform** | Create an app from GitHub; add 3 **components**: one Docker (backend), one Docker (frontend), one **Managed Database** (Postgres). Connect with env vars. | Simple UI, managed DB. |
| **VPS (Hetzner, DO Droplet, etc.)** | Rent a server, clone the repo, run `docker-compose up -d`. Everything runs on one machine. Use Caddy/Nginx as reverse proxy and optional SSL (e.g. Let’s Encrypt). | Full control, one bill. |

**Summary:** For “complete Docker, front + back + DB in one place”, the most straightforward are **Railway** (managed Postgres + 2 Docker services) or **Render** (Blueprint with Postgres + 2 web services). **Fly.io** and **DigitalOcean App Platform** also run your Docker images and a database. A **VPS** runs your existing `docker-compose` as-is.

### Deploy on DigitalOcean

Use **App Platform** (managed) or a **Droplet** (VPS). **Full guide:** [docs/DEPLOY-DIGITALOCEAN.md](docs/DEPLOY-DIGITALOCEAN.md).

**Option A – App Platform:** Create App → Connect repo `iamsnh1/Restaurant-Pos`. Add **Database** (PostgreSQL), then two **Docker** components: (1) **backend** – Source Directory `backend`, Dockerfile `Dockerfile`, port `5001`, env `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`; (2) **frontend** – Source Directory `frontend`, Dockerfile `Dockerfile`, port `80`, build arg `VITE_API_URL` = `https://YOUR-BACKEND-URL/api`. After deploy, set backend’s `FRONTEND_URL` to the frontend URL. First user: `POST https://YOUR-BACKEND-URL/api/auth/setup` with `{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}`.

**Option B – Droplet:** Ubuntu Droplet → install Docker (`curl -fsSL https://get.docker.com | sh`, add user to `docker` group) and Docker Compose plugin. Then: `git clone https://github.com/iamsnh1/Restaurant-Pos.git && cd Restaurant-Pos`, `echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env`, `docker compose up -d --build`. Open `http://YOUR_DROPLET_IP`; login admin@restaurant.com / admin123. Optional: Caddy or Nginx + Let’s Encrypt for HTTPS.

---

## Deploy Everything Together (Recommended)

**Want everything in one deployment?** Use Railway or Render - they deploy your entire app (frontend + backend + database) from a single Docker container.

### Option 1: Railway (Easiest) ⭐

**One deployment, everything works.** See [RAILWAY-DEPLOY.md](RAILWAY-DEPLOY.md) for full guide.

**Quick steps:**
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select `iamsnh1/Restaurant-Pos`
3. Add PostgreSQL database (click "+ New" → Database → PostgreSQL)
4. Set env vars: `JWT_SECRET` (generate: `openssl rand -base64 32`), `PORT=5001`, `NODE_ENV=production`
5. Railway auto-deploys your `Dockerfile` (frontend + backend in one container)
6. Get your URL: `https://your-app.railway.app`
7. Create first admin: `POST https://your-app.railway.app/api/auth/setup` with `{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}`

**That's it!** Everything runs in one container. No separate deployments.

### Option 2: Render

**One blueprint file, everything deployed.** See [RENDER-DEPLOY.md](RENDER-DEPLOY.md) for full guide.

**Quick steps:**
1. Go to [render.com](https://render.com) → New → Blueprint
2. Connect GitHub repo `iamsnh1/Restaurant-Pos`
3. Render uses `render.yaml` to deploy everything
4. Get your URL and create first admin

---

## Deploy frontend on Netlify (Separate Deployment)

**Note:** Netlify only hosts static sites, so you'd need to deploy backend separately. **Not recommended** - use Railway or Render instead for single deployment.

If you still want Netlify: See [docs/DEPLOY-NETLIFY.md](docs/DEPLOY-NETLIFY.md) for guide.

---

## Deploy frontend on Vercel

The **frontend** (Voxxera POS UI) can be deployed on Vercel. The **backend** (Node + Express + Socket.io + PostgreSQL) must run elsewhere (e.g. Railway, Render) because Vercel is for static/serverless, not long‑running servers or WebSockets.

### 1. Deploy the backend first

- Deploy the `backend` folder to **Railway**, **Render**, or another Node host.
- Create a **PostgreSQL** database and set `DATABASE_URL`.
- Run migrations and seed (or use the `/api/auth/setup` endpoint once).
- Note your backend URL (e.g. `https://your-app.up.railway.app`).

### 2. Deploy the frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. **Add New Project** → **Import** your repo `iamsnh1/Restaurant-Pos`.
3. **Configure:**
   - **Root Directory:** click *Edit*, set to **`frontend`**, then *Continue*.
   - **Framework Preset:** Vite (auto-detected).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment variables** (required):
   - Name: `VITE_API_URL`  
   - Value: `https://YOUR-BACKEND-URL/api`  
   (e.g. `https://your-app.up.railway.app/api`)
5. Click **Deploy**. Vercel will build and host the frontend; the app will call your backend using `VITE_API_URL`.

### 3. After deploy

- Open the Vercel URL (e.g. `https://restaurant-pos-xxx.vercel.app`).
- Log in with your backend user (e.g. admin@restaurant.com).
- To use a custom domain, add it in the Vercel project *Settings → Domains*.

## License
ISC
