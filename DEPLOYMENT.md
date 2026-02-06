# Voxxera POS - Deployment Summary

## Current Hosting: DigitalOcean App Platform

### App Details
- **App ID:** `9a408f2e-dbda-42be-b87c-e84d1cdf9040`
- **App Name:** voxxera-pos
- **Region:** NYC
- **Status:** Deploying (single-container: frontend + backend)
- **Live URL:** Check [DigitalOcean Dashboard](https://cloud.digitalocean.com/apps) → voxxera-pos → Live URL

### Components
- **web** (single service): Frontend (nginx) + Backend (Node) in one Docker container
  - Port: 80
  - Instance: basic-xxs
  - Auto-deploy: Enabled (on push to main)
- **posdb** (PostgreSQL database)
  - Engine: PostgreSQL 15
  - Production: false

### Environment Variables (Set via Dashboard)
After deployment, set these in **Settings → Environment Variables** for the **web** component:

1. **DATABASE_URL** - Auto-bound from posdb (already configured in spec)
2. **JWT_SECRET** - Generate with: `openssl rand -base64 32`
3. **NODE_ENV** - Already set to `production`
4. **PORT** - Already set to `5001`

---

## GitHub Repository
- **Repo:** https://github.com/iamsnh1/Restaurant-Pos
- **Branch:** main
- **Auto-deploy:** Enabled (pushes to main trigger rebuild)

---

## First Login Setup

Once the app is live and env vars are set:

```bash
curl -X POST https://YOUR-APP-LIVE-URL/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@restaurant.com","password":"admin123"}'
```

Then log in with:
- **Email:** admin@restaurant.com
- **Password:** admin123

---

## Update Deployment

```bash
# Update app spec
doctl apps update 9a408f2e-dbda-42be-b87c-e84d1cdf9040 --spec .do/app-spec.yaml

# Check status
doctl apps get 9a408f2e-dbda-42be-b87c-e84d1cdf9040

# View logs (after deployment succeeds)
doctl apps logs 9a408f2e-dbda-42be-b87c-e84d1cdf9040 --type run

# View build logs
doctl apps logs 9a408f2e-dbda-42be-b87c-e84d1cdf9040 --type build
```

---

## Files
- **Root Dockerfile:** `Dockerfile` (single-container, frontend + backend)
- **DO App Spec:** `.do/app-spec.yaml` (one service + database)
- **Deploy docs:** `.do/DEPLOY-STEPS.md`, `docs/DEPLOY-DIGITALOCEAN.md`
- **Local docker-compose:** `docker-compose.yml` (for local dev)

---

## Next Steps

1. ✅ App spec updated with database binding
2. ⏳ Wait for deployment to complete (check dashboard)
3. ⏳ Set JWT_SECRET in dashboard (Settings → Environment Variables)
4. ⏳ Get live URL from dashboard
5. ⏳ Run `/api/auth/setup` to create first admin user
6. ⏳ Log in and start using Voxxera POS!
